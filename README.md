# Google Analytics for Brightcove player

Google Analytics plugin for the Brightcove player.

*Note this is not compatible with the Brightcove Smart Player which uses a different plugin architecture and API.*

This plugin was forked from the open source plugin written for video.js [videojs.ga](https://github.com/mickey/videojs-ga) to add changes specific to the Brightcove Player. Main changes from the original:

- The video ID and name are read from the player and tracked as the event label.
- Works with the standard (iframe) embed and direct player links: If a tracker is set in the plugin options, the Google universal analytics script will be loaded.
- Event names tracked are those used by the Smart Player plugins, where applicable. Event names can be customised / localised with plugin options.
- The plugin will not track events when the player is viewed in the Video Cloud Studio.

## Getting Started

- If you want to self-host, download the plugin from `dist/` and place on your server. Alternatively use the version hosted by [unpkg](https://unpkg.com) at https://unpkg.com/videojs-ga-videocloud@dist/videojs-ga-videocloud.min.js.js

### Studio configuration

- Edit the player configuration in the [Players Module of Video Cloud Studio](https://studio.brightcove.com/products/videocloud/players).
- Under _Plugins>JavaScript_, add the URL to the plugin to the player configuration and click +.
- Under _Plugins>Name, Options (JSON)_, enter `ga` as the name and click `+`.

If you want use the standard (iframe) embed, you need to also add the tracker to the plugin configuration under _Plugins>Name, Options (JSON)_:

```json
{
    "tracker": "UA-1234567-8"
}
```

### Configuration with the Player Management API

You can configure the plugin with the [player management API](http://docs.brightcove.com/en/video-cloud/player-management/index.html) instead of the GUI studio. For example, to add the plugin to an existing player:

```bash
curl --header "Content-Type: application/json" --user $EMAIL --request PATCH --data '{"scripts":["https://unpkg.com/videojs-ga-videocloud@dist/videojs-ga-videocloud.min.js.js"],"plugins":[{"name":"ga","options":{"tracker":"UA-1234567-8","eventNames":{"play":"Wiedergabe"}}}]}' https://players.api.brightcove.com/v1/accounts/$ACCOUNT_ID/players/$PLAYER_ID/configuration
```

### Standard vs Advanced Embed

If using the iframe embed, you must specify the tracker in the player config. The reacking script will be loaded.

If you use the advanced (in-page) embed, the player will track events to the GA tracker on the page. That tracker must load before the player initialises. The plugin will _not_ load Google Analytics.

When using the advanced embed the events are tracked in context with the rest of the visitor's interactions with the page. When using the iframe they are isolated to the player iframe.

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

### tracker

- If set, this tracker code will be used for iframe embeds and the direct player URL.
- If set and `trackerName` is not set on an in-page embed, this is not used.
- If set and `trackerName` is set on an in-page embed, this is used for the named tracker.

**default:** Not set

### trackerName

If set, use this as the [tracker name](https://developers.google.com/analytics/devguides/collection/analyticsjs/creating-trackers).

#### eventNames

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

#### eventCategory

This is the ```category``` sent to GA. If you don't know what it is please check [GA's doc](https://developers.google.com/analytics/devguides/collection/gajs/eventTrackerGuide)

**default:** ```'Brightcove Player'```

#### eventLabel

This is the ```label``` sent to GA. If you don't know what it is please check [GA's doc](https://developers.google.com/analytics/devguides/collection/gajs/eventTrackerGuide)

**default:** `VIDEO_ID | VIDEO_NAME`.

#### eventsToTrack

The events you want to track. For example `start` (playback started for the first time) and `end` are probably more interesting than `play` and `pause`.

**default:**

```
[ 'player_load', 'video_load', 'percent_played', 'start', 'end', 'seek', 'play', 'pause', 'resize', 'volume_change', 'error', 'fullscreen']
```

- `player_load` Player has loaded.
- `video_load` Video has loaded. Will fire again when a new video is loaded.
- `percent_played` Every *x*% of the video, with the percentage as a value, where *x* is defined by `percentsPlayedInterval`. Default is 10.
- `start` Playback has started. Once per video load.
- `end` Playback has completed. Once per video load.

#### percentsPlayedInterval

This options goes with the ```percents_played``` event. Every ```percentsPlayedInterval``` percents an event will be sent to GA.

**default:** 10

### debug

If set to false, console logs will be omited
**default:** ```false```

#### sendbeaconOverride
In the event you want to do something custom for all tracked events, use this option to pass a callback function to the plugin. The callback will have access to the following variables and will **override the plugin's native tracking methods**:

- `eventCategory`
- `action`
- `eventLabel`
- `value`
- `nonInteraction`

## TODO

- [ ] Support ad events
