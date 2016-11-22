##
# ga
# https://github.com/mickey/videojs-ga
#
# Copyright (c) 2013 Michael Bensoussan
# Licensed under the MIT license.
##

videojs.plugin 'ga', (options = {}) ->

  referrer = document.createElement('a')
  referrer.href = document.referrer
  if (self != top && window.location.host == 'preview-players.brightcove.net' && referrer.hostname = 'studio.brightcove.com')
    videojs.log('Google analytics plugin will not track events in Video Cloud Studio')
    return

  player = @

  # this loads options from the data-setup attribute of the video tag
  dataSetupOptions = {}
  if @options()["data-setup"]
    parsedOptions = JSON.parse(@options()["data-setup"])
    dataSetupOptions = parsedOptions.ga if parsedOptions.ga

  defaultsEventsToTrack = [
    'player_load', 'video_load', 'percent_played', 'start',
    'end', 'seek', 'play', 'pause', 'resize',
    'volume_change', 'error', 'fullscreen'
  ]
  eventsToTrack = options.eventsToTrack || dataSetupOptions.eventsToTrack || defaultsEventsToTrack
  percentsPlayedInterval = options.percentsPlayedInterval || dataSetupOptions.percentsPlayedInterval || 10

  eventCategory = options.eventCategory || dataSetupOptions.eventCategory || 'Brightcove Player'
  # if you didn't specify a name, it will be 'guessed' from the video src after metadatas are loaded
  defaultLabel = options.eventLabel || dataSetupOptions.eventLabel

  #override the send beacon method - in our case, we need to do data layer pushes
  sendbeaconOverride = options.sendbeaconOverride || false

  # init a few variables
  percentsAlreadyTracked = []
  startTracked = false
  endTracked = false
  seekStart = seekEnd = 0
  seeking = false
  eventLabel = ''
  currentVideo = ''

  eventNames = {
    "video_load": "Video Load",
    "percent_played": "Percent played",
    "start": "Media Begin",
    "seek_start": "Seek start",
    "seek_end": "Seek end",
    "play": "Media Play",
    "pause": "Media Pause",
    "error": "Error",
    "fullscreen_exit": "Fullscreen Exited",
    "fullscreen_enter": "Fullscreen Entered",
    "resize": "Resize",
    "volume_change": "Volume Change",
    "player_load": "Player Load",
    "end": "Media Complete"
  }

  getEventName = ( name ) ->
    if options.eventNames && options.eventNames[name]
      return options.eventNames[name]
    if dataSetupOptions.eventNames && dataSetupOptions.eventNames[name]
      return dataSetupOptions.eventNames[name]
    if eventNames[name]
      return eventNames[name]
    return name

  getCommandName = ( name ) ->
    if !window.ga || name == 'create'
      return name

    trackerName = getTrackerName()
    if trackerName
      return trackerName + '.' + name

    return name

  getTrackerName = () ->
    if options.trackerName
      return options.trackerName
    if dataSetupOptions.trackerName
      return dataSetupOptions.trackerName

    if window.ga && window.ga.getAll
      trackers = ga.getAll()
      if trackers.length > 0
        return trackers[0].get('name')

    return null

  # load ga script if in iframe and tracker option is set
  if window.location.host == 'players.brightcove.net' || window.location.host == 'preview-players.brightcove.net'
    tracker = options.tracker || dataSetupOptions.tracker
    if tracker
      ((i, s, o, g, r, a, m) ->
        i["GoogleAnalyticsObject"] = r
        i[r] = i[r] or ->
          (i[r].q = i[r].q or []).push arguments

        i[r].l = 1 * new Date()

        a = s.createElement(o)
        m = s.getElementsByTagName(o)[0]

        a.async = 1
        a.src = g
        m.parentNode.insertBefore a, m
      ) window, document, "script", "//www.google-analytics.com/analytics.js", "ga"
      ga('create', tracker, 'auto')
      ga('require', 'displayfeatures');

  # get ad state of player
  adStateRegex = /(\s|^)vjs-ad-(playing|loading)(\s|$)/
  isInAdState = ( player ) =>
    return adStateRegex.test( player.el().className )

  loaded = ->
    if !isInAdState( player )
      # Event label is Video Cloud ID | Name, or filename (Perform), or overridden
      if defaultLabel
        eventLabel = defaultLabel
      else
        if player.mediainfo && player.mediainfo.id
          eventLabel = player.mediainfo.id + ' | ' + player.mediainfo.name
        else
          eventLabel = @currentSrc().split("/").slice(-1)[0].replace(/\.(\w{3,4})(\?.*)?$/i,'')
      if player.mediainfo && player.mediainfo.id && player.mediainfo.id != currentVideo
        currentVideo = player.mediainfo.id
        percentsAlreadyTracked = []
        startTracked = false
        endTracked = false
        seekStart = seekEnd = 0
        seeking = false

        if "video_load" in eventsToTrack
          sendbeacon( getEventName('video_load'), true )

      return

  timeupdate = ->
    if !isInAdState( player )
      currentTime = Math.round(@currentTime())
      duration = Math.round(@duration())
      percentPlayed = Math.round(currentTime/duration*100)

      for percent in [0..99] by percentsPlayedInterval
        if percentPlayed >= percent && percent not in percentsAlreadyTracked

          if "percent_played" in eventsToTrack && percentPlayed != 0
            sendbeacon( getEventName('percent_played'), true, percent )

          if percentPlayed > 0
            percentsAlreadyTracked.push(percent)

      if "seek" in eventsToTrack
        seekStart = seekEnd
        seekEnd = currentTime
        # if the difference between the start and the end are greater than 1 it's a seek.
        if Math.abs(seekStart - seekEnd) > 1
          seeking = true
          sendbeacon( getEventName('seek_start'), false, seekStart )
          sendbeacon( getEventName('seek_end'), false, seekEnd )

      return

  end = ->
    if !isInAdState( player ) && !endTracked
      sendbeacon( getEventName('end'), true )
      endTracked = true
    return

  play = ->
    if !isInAdState( player )
      currentTime = Math.round(@currentTime())
      sendbeacon( getEventName('play'), true, currentTime )
      seeking = false
      return

  start = ->
    if !isInAdState( player )
      if "start" in eventsToTrack && !startTracked
        sendbeacon( getEventName('start'), true )
        startTracked = true

  pause = ->
    if !isInAdState( player )
      currentTime = Math.round(@currentTime())
      duration = Math.round(@duration())
      if currentTime != duration && !seeking
        sendbeacon( getEventName('pause'), true, currentTime )
      return

  # value between 0 (muted) and 1
  volumeChange = ->
    volume = if @muted() == true then 0 else @volume()
    sendbeacon( getEventName('volume_change'), false, volume )
    return

  resize = ->
    sendbeacon( getEventName('resize') + ' - ' + @width() + "*" + @height(), true )
    return

  error = ->
    currentTime = Math.round(@currentTime())
    # XXX: Is there some informations about the error somewhere ?
    sendbeacon( getEventName('error'), true, currentTime )
    return

  fullscreen = ->
    currentTime = Math.round(@currentTime())
    if @isFullscreen?() || @isFullScreen?()
      sendbeacon( getEventName('fullscreen_enter'), false, currentTime )
    else
      sendbeacon( getEventName('fullscreen_exit'), false, currentTime )
    return

  sendbeacon = ( action, nonInteraction, value ) ->
    # videojs.log action, " ", nonInteraction, " ", value
    if sendbeaconOverride
      sendbeaconOverride(eventCategory, action, eventLabel, value, nonInteraction)
    else if window.ga
      ga getCommandName('send'), 'event',
        'eventCategory' 	: eventCategory
        'eventAction'		  : action
        'eventLabel'		  : eventLabel
        'eventValue'      : value
        'nonInteraction'	: nonInteraction
    else if window._gaq
      _gaq.push(['_trackEvent', eventCategory, action, eventLabel, value, nonInteraction])
    else
      videojs.log("Google Analytics not detected")
    return

  if "player_load" in eventsToTrack
    unless self == top
      href = document.referrer
      iframe = 1
    else
      href = window.location.href
      iframe = 0

		if sendbeaconOverride
      sendbeaconOverride(eventCategory, getEventName('player_load'), href, iframe, true)
    else if window.ga
      ga getCommandName('send'), 'event',
        'eventCategory' 	: eventCategory
        'eventAction'		  : getEventName('player_load')
        'eventLabel'		  : href
        'eventValue'      : iframe
        'nonInteraction'	: true
    else if window._gaq
      _gaq.push(['_trackEvent', eventCategory, getEventName('player_load'), href, iframe, false])
    else
      videojs.log("Google Analytics not detected")

  @ready ->
    @on("loadedmetadata", loaded) # use loadstart?
    @on("timeupdate", timeupdate)
    @on("ended", end) if "end" in eventsToTrack
    @on("play", play) if "play" in eventsToTrack
    @on("playing", start) if "start" in eventsToTrack
    @on("pause", pause) if "pause" in eventsToTrack
    @on("volumechange", volumeChange) if "volume_change" in eventsToTrack
    @on("resize", resize) if "resize" in eventsToTrack
    @on("error", error) if "error" in eventsToTrack
    @on("fullscreenchange", fullscreen) if "fullscreen" in eventsToTrack
  return
