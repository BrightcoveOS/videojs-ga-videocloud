/*
* videojs-ga-videocloud - v0.5.0 - 2018-10-07
* Based on videojs-ga 0.4.2
* Copyright (c) 2018 Michael Bensoussan
* Licensed MIT
*/
(function() {
  var registerPlugin,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  registerPlugin = videojs.registerPlugin || videojs.plugin;

  registerPlugin('ga', function(options) {
    var adStateRegex, currentVideo, dataSetupOptions, defaultLabel, defaultsEventsToTrack, end, endTracked, error, eventCategory, eventLabel, eventNames, eventsToTrack, fullscreen, getEventName, isInAdState, loaded, parsedOptions, pause, percentsAlreadyTracked, percentsPlayedInterval, play, player, referrer, resize, seekEnd, seekStart, seeking, sendbeacon, sendbeaconOverride, start, startTracked, timeupdate, tracker, trackerName, volumeChange,
      _this = this;
    if (options == null) {
      options = {};
    }
    referrer = document.createElement('a');
    referrer.href = document.referrer;
    if (self !== top && window.location.host === 'preview-players.brightcove.net' && referrer.hostname === 'studio.brightcove.com') {
      videojs.log('Google analytics plugin will not track events in Video Cloud Studio');
      return;
    }
    player = this;
    dataSetupOptions = {};
    if (this.options_["data-setup"]) {
      parsedOptions = JSON.parse(this.options()["data-setup"]);
      if (parsedOptions.ga) {
        dataSetupOptions = parsedOptions.ga;
      }
    }
    defaultsEventsToTrack = ['player_load', 'video_load', 'percent_played', 'start', 'end', 'seek', 'play', 'pause', 'resize', 'volume_change', 'error', 'fullscreen'];
    eventsToTrack = options.eventsToTrack || dataSetupOptions.eventsToTrack || defaultsEventsToTrack;
    percentsPlayedInterval = options.percentsPlayedInterval || dataSetupOptions.percentsPlayedInterval || 10;
    eventCategory = options.eventCategory || dataSetupOptions.eventCategory || 'Brightcove Player';
    defaultLabel = options.eventLabel || dataSetupOptions.eventLabel;
    sendbeaconOverride = options.sendbeaconOverride || false;
    options.debug = options.debug || false;
    options.trackerName = options.trackerName || null;
    trackerName = '';
    if (typeof options.trackerName === 'string') {
      trackerName = options.trackerName + '.';
    }
    percentsAlreadyTracked = [];
    startTracked = false;
    endTracked = false;
    seekStart = seekEnd = 0;
    seeking = false;
    eventLabel = '';
    currentVideo = '';
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
    };
    getEventName = function(name) {
      if (options.eventNames && options.eventNames[name]) {
        return options.eventNames[name];
      }
      if (dataSetupOptions.eventNames && dataSetupOptions.eventNames[name]) {
        return dataSetupOptions.eventNames[name];
      }
      if (eventNames[name]) {
        return eventNames[name];
      }
      return name;
    };
    if (window.location.host === 'players.brightcove.net' || window.location.host === 'preview-players.brightcove.net' || trackerName !== '') {
      tracker = options.tracker || dataSetupOptions.tracker;
      if (tracker) {
        (function(i, s, o, g, r, a, m) {
          i["GoogleAnalyticsObject"] = r;
          i[r] = i[r] || function() {
            return (i[r].q = i[r].q || []).push(arguments);
          };
          i[r].l = 1 * new Date();
          a = s.createElement(o);
          m = s.getElementsByTagName(o)[0];
          a.async = 1;
          a.src = g;
          return m.parentNode.insertBefore(a, m);
        })(window, document, "script", "//www.google-analytics.com/analytics.js", "ga");
        ga('create', tracker, 'auto', options.trackerName);
        ga(trackerName + 'require', 'displayfeatures');
      }
    }
    adStateRegex = /(\s|^)vjs-ad-(playing|loading)(\s|$)/;
    isInAdState = function(player) {
      return adStateRegex.test(player.el().className);
    };
    loaded = function() {
      if (!isInAdState(player)) {
        if (defaultLabel) {
          eventLabel = defaultLabel;
        } else {
          if (player.mediainfo && player.mediainfo.id) {
            eventLabel = player.mediainfo.id + ' | ' + player.mediainfo.name;
          } else {
            eventLabel = this.currentSrc().split("/").slice(-1)[0].replace(/\.(\w{3,4})(\?.*)?$/i, '');
          }
        }
        if (player.mediainfo && player.mediainfo.id && player.mediainfo.id !== currentVideo) {
          currentVideo = player.mediainfo.id;
          percentsAlreadyTracked = [];
          startTracked = false;
          endTracked = false;
          seekStart = seekEnd = 0;
          seeking = false;
          if (__indexOf.call(eventsToTrack, "video_load") >= 0) {
            sendbeacon(getEventName('video_load'), true);
          }
        }
      }
    };
    timeupdate = function() {
      var currentTime, duration, percent, percentPlayed, _i;
      if (!isInAdState(player)) {
        currentTime = Math.round(this.currentTime());
        duration = Math.round(this.duration());
        percentPlayed = Math.round(currentTime / duration * 100);
        for (percent = _i = 0; _i <= 99; percent = _i += percentsPlayedInterval) {
          if (percentPlayed >= percent && __indexOf.call(percentsAlreadyTracked, percent) < 0) {
            if (__indexOf.call(eventsToTrack, "percent_played") >= 0 && percentPlayed !== 0) {
              sendbeacon(getEventName('percent_played'), true, percent);
            }
            if (percentPlayed > 0) {
              percentsAlreadyTracked.push(percent);
            }
          }
        }
        if (__indexOf.call(eventsToTrack, "seek") >= 0) {
          seekStart = seekEnd;
          seekEnd = currentTime;
          if (Math.abs(seekStart - seekEnd) > 1) {
            seeking = true;
            sendbeacon(getEventName('seek_start'), false, seekStart);
            sendbeacon(getEventName('seek_end'), false, seekEnd);
          }
        }
      }
    };
    end = function() {
      if (!isInAdState(player) && !endTracked) {
        sendbeacon(getEventName('end'), true);
        endTracked = true;
      }
    };
    play = function() {
      var currentTime;
      if (!isInAdState(player)) {
        currentTime = Math.round(this.currentTime());
        sendbeacon(getEventName('play'), true, currentTime);
        seeking = false;
      }
    };
    start = function() {
      if (!isInAdState(player)) {
        if (__indexOf.call(eventsToTrack, "start") >= 0 && !startTracked) {
          sendbeacon(getEventName('start'), true);
          return startTracked = true;
        }
      }
    };
    pause = function() {
      var currentTime, duration;
      if (!isInAdState(player)) {
        currentTime = Math.round(this.currentTime());
        duration = Math.round(this.duration());
        if (currentTime !== duration && !seeking) {
          sendbeacon(getEventName('pause'), true, currentTime);
        }
      }
    };
    volumeChange = function() {
      var volume;
      volume = this.muted() === true ? 0 : this.volume();
      sendbeacon(getEventName('volume_change'), false, volume);
    };
    resize = function() {
      sendbeacon(getEventName('resize') + ' - ' + this.width() + "*" + this.height(), true);
    };
    error = function() {
      var currentTime;
      currentTime = Math.round(this.currentTime());
      sendbeacon(getEventName('error'), true, currentTime);
    };
    fullscreen = function() {
      var currentTime;
      currentTime = Math.round(this.currentTime());
      if (this.isFullscreen()) {
        sendbeacon(getEventName('fullscreen_enter'), false, currentTime);
      } else {
        sendbeacon(getEventName('fullscreen_exit'), false, currentTime);
      }
    };
    sendbeacon = function(action, nonInteraction, value) {
      if (sendbeaconOverride) {
        sendbeaconOverride(eventCategory, action, eventLabel, value, nonInteraction);
      } else if (window.ga) {
        ga(trackerName + 'send', 'event', {
          'eventCategory': eventCategory,
          'eventAction': action,
          'eventLabel': eventLabel,
          'eventValue': value,
          'nonInteraction': nonInteraction
        });
      } else if (window._gaq) {
        _gaq.push(['_trackEvent', eventCategory, action, eventLabel, value, nonInteraction]);
      } else if (options.debug) {
        videojs.log("Google Analytics not detected");
      }
    };
    this.ready(function() {
      var href, iframe;
      this.on("loadedmetadata", loaded);
      this.on("timeupdate", timeupdate);
      if (__indexOf.call(eventsToTrack, "end") >= 0) {
        this.on("ended", end);
      }
      if (__indexOf.call(eventsToTrack, "play") >= 0) {
        this.on("play", play);
      }
      if (__indexOf.call(eventsToTrack, "start") >= 0) {
        this.on("playing", start);
      }
      if (__indexOf.call(eventsToTrack, "pause") >= 0) {
        this.on("pause", pause);
      }
      if (__indexOf.call(eventsToTrack, "volume_change") >= 0) {
        this.on("volumechange", volumeChange);
      }
      if (__indexOf.call(eventsToTrack, "resize") >= 0) {
        this.on("resize", resize);
      }
      if (__indexOf.call(eventsToTrack, "error") >= 0) {
        this.on("error", error);
      }
      if (__indexOf.call(eventsToTrack, "fullscreen") >= 0) {
        this.on("fullscreenchange", fullscreen);
      }
      if (__indexOf.call(eventsToTrack, "player_load") >= 0) {
        if (self !== top) {
          href = document.referrer;
          iframe = 1;
        } else {
          href = window.location.href;
          iframe = 0;
        }
        if (sendbeaconOverride) {
          return sendbeaconOverride(eventCategory, getEventName('player_load'), href, iframe, true);
        } else if (window.ga) {
          return ga(trackerName + 'send', 'event', {
            'eventCategory': eventCategory,
            'eventAction': getEventName('player_load'),
            'eventLabel': href,
            'eventValue': iframe,
            'nonInteraction': true
          });
        } else if (window._gaq) {
          return _gaq.push(['_trackEvent', eventCategory, getEventName('player_load'), href, iframe, false]);
        } else {
          return videojs.log("Google Analytics not detected");
        }
      }
    });
    return {
      'sendbeacon': sendbeacon
    };
  });

}).call(this);
