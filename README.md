# Google Analytics for Brightcove player

Google Analytics plugin for the next generation Brightcove player.

*Note this is not compatible with the Brightcove Smart Player which uses a different plugin architecture and API.*

This plugin was forked from the open source plugin written for video.js [videojs.ga](https://github.com/mickey/videojs-ga). Main changes from the original:

- The video ID and name are read from the player and tracked as the event label
- If the player is in an iframe embed or loaded directly on `(preview-)players.brightcove.net` *and* a tracker is set in the plugin options, the Google universal analytics script will be loaded by the plugin. If the in page embed is used Google Analytics must be separately loaded on the page before the player, as with the original videojs-ga.
- Event names tracked are those used by the Smart Player plugins, where applicable. Event names can be customised / localised with plugin options.
- The plugin will not track events when the player is viewed in the Video Cloud Studio.

## Getting Started
* Download the plugin and place on your server.
* Edit the player configuration in the [Players Module of Video Cloud Studio](https://studio.brightcove.com/products/videocloud/players).
* Under _Plugins>JavaScript_, add the URL to the plugin to the player configuration and click +.
* Under _Plugins>Name, Options (JSON)_, enter `ga` as the name and click `+`.

If you want to use the in-page embed only, this is enough, but **you must ensure that Google Analytics is loaded on the page before the player**.

If you want use the iframe embed or direct player link, you need to also add the tracker to the plugin configuration under _Plugins>Name, Options (JSON)_:

```json
{
    "tracker": "UA-1234567-8"
}
```

### Configuration with the Player Management API

You can configure the plugin with the [player management API](http://docs.brightcove.com/en/video-cloud/player-management/index.html) instead of the GUI studio. For example, to add the plugin to an existing player:

```bash
curl --header "Content-Type: application/json" --user $EMAIL --request PATCH --data '{"scripts":["http://example.com/videojs.ga.videocloud.js"],"plugins":[{"name":"ga","options":{"tracker":"UA-1234567-8","eventNames":{"play":"Wiedergabe"}}}]}' https://players.api.brightcove.com/v1/accounts/$ACCOUNT_ID/players/$PLAYER_ID/configuration
```

### Classic and Universal Analytics

If the in-page embed is used, this plugin supports the "classic" ga.js and "universal" analytics.js Google Analytics libraries. It autodetects the library you use.

If the iframe embed or direct player URL is used, and a tracker is provided, the "universal" analytics.js is used.

## Options

Provide options to the plugin in the player configuraiton using `ga` as the name.

```json
{
  "tracker": "UA-1234567-8",
  "eventNames": {
    "play": "Wiedergabe"
  }
}
```

The following options are supported:

####tracker

If set, this tracker code will be used for iframe embeds and the direct player URL. This is not used for in-page embeds

**default:** Not set

####trackerName

If set, the tracker with this name will be used for in-page embeds.  This should match the ```name``` field sent in the GA ```create``` command for the tracker you want associated with the player.  If you don't know what it is please check [GA's doc](https://developers.google.com/analytics/devguides/collection/analyticsjs/creating-trackers)

**default:** Not set

####eventNames

Override or localise the names of the event actions.

**default:**
```
{
  "video_load": "Video Load",
  "percent_played": "Percent played",
  "start": "Media Begin",
  "seek_start": "Seek start",
  "seek_end": "Seek end",
  "play": "Media Play",
  "pause": "Media Pause",
  "error": "Error",
  "fullscreen_exit": "Fullscreen Entered",
  "fullscreen_exit": "Fullscreen Exited",
  "resize": "Resize",
  "volume_change": "Volume Change",
  "player_load": "Player Load",
  "end": "Media Complete"
}
```

####eventCategory

This is the ```category``` sent to GA. If you don't know what it is please check [GA's doc](https://developers.google.com/analytics/devguides/collection/gajs/eventTrackerGuide)

**default:** ```'Brightcove Player'```

####eventLabel

This is the ```label``` sent to GA. If you don't know what it is please check [GA's doc](https://developers.google.com/analytics/devguides/collection/gajs/eventTrackerGuide)

**default:** `VIDEO_ID | VIDEO_NAME`.

####eventsToTrack

The events you want to track. For example `start` (playback started for the first time) and `end` are probably more interesting than `play` and `pause`.

**default:**
```
[ 'player_load', 'video_load', 'percent_played', 'start', 'end', 'seek', 'play', 'pause', 'resize', 'volume_change', 'error', 'fullscreen']
```

* `player_load` Player has loaded.
* `video_load` Video has loaded. Will fire again when a new video is loaded.
* `percent_played` Every *x*% of the video, with the percentage as a value, where *x* is defined by `percentsPlayedInterval`. Default is 10.
* `start` Playback has started. Once per video load.
* `end` Playback has completed. Once per video load.

####percentsPlayedInterval

This options goes with the ```percents_played``` event. Every ```percentsPlayedInterval``` percents an event will be sent to GA.

**default:** 10

####sendbeaconOverride
In the event you want to do something custom for all tracked events, use this option to pass a callback function to the plugin. The callback will have access to the following variables and will **override the plugins native tracking methods**:
* `eventCategorty`
* `action`
* `eventLabel`
* `value`
* `nonInteraction`


## TODO

- [x] Support media change - "video_load" event
- [ ] Support ad events
