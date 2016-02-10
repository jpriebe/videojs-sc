# videojs-sc

Adobe Analytics (formerly Site Catalyst) plugin for video.js

## Getting Started
Download [videojs](http://www.videojs.com/) and [videojs.sc](https://github.com/jpriebe/videojs-sc)

In your web page:
```html
<video id="video" src="movie.mp4" controls></video>
<script src="video.js"></script>
<script src="dist/videojs.sc.min.js"></script>
<script>
var s = s_gi ('MY_SUITE_ID');
// configuration of s omitted

s.loadModule ('Media')
// configuration of s.Media omitted

function get_current_video_info ()
{
  return {
    'name': 'Name of the current video',
    'channel': 'Channel of the current video',
    'props':  {
      prop1: 'prop 1 value',
      prop2: 'prop 2 value',
      // ...
      propN: 'prop N value'
    }
  };
}

videojs('video', {}, function() {
  this.sc({
    player_name: 'My Awesome Video Player',
    sc: s,
    new_video_cb: get_current_video_info
  });
});
</script>
```

_Please note that the VisitorID, AppMeasurement, and AppMeasurement_Module_Media scripts must be loaded and configured before the sc plugin_

## Options

Provide options to the plugin by passing them in the javascript call to initialize
the plugin.

```javascript
player.sc({
  sc: s,
  new_video_cb: get_current_video_info,
  player_name: 'My Awesome Video Player',
  new_video_event: 'vast.contentStart'
});
```

The following options are supported:

#### sc (required)

A reference to the s object, as returned from s_gi ();

#### new_video_cb (required)

A callback that the plugin will use when a new video is started; the callback returns
an object that provides basic information about the video.  The returned object should be
of this format:

```javascript    
{
    'name': 'Name of the current video',
    'channel': 'Channel of the current video',
    'props':  {
      prop1: 'prop 1 value',
      prop2: 'prop 2 value',
      // ...
      propN: 'prop N value'
    }
}
```

Note that any props you define will be applied to the "s" object, and must also be included
in the s.Media.trackVars variable when you are configuring s.Media.

#### player_name

The name of your video player to use in the analytics calls.  Defaults to "VideoJS".

#### new_video_event

By default, the plugin will wait for a `loadedmetadata` event to make a call to
`s.Media.open()`.  If you would prefer to wait for another event, you can specify
its name here.  

As an example, if you are using videojs-vast-vpaid plugin, you would get a
`loadedmetadata` event when the main content video loads in, as well as one when
the preroll video loads in.  You would probably not want to start recording analytics
when the first `loadedmetadata` event fires, as the user hasn't really started
watching the content video yet.

The videojs-vast-vpaid plugin fires an event when the preroll is done playing and
the content video is starting: `vast.contentStart`.  By specifying `vast.contentStart`
for `new_video_event`, you can start tracking the content video when it actually
starts playing.

#### verbosity

If set to non-zero, logs debugging messages to the console.   A value of 1 will output the most
important messages; a value of 2 will output a lot of time update messages.

## Caveats

We have noticed some oddities with the way events are fired by the videojs-swf player when the user clicks on the timeline to skip forward.

```
[videojs.sc] <ontimeupdate> _media_offset: 4
[videojs.sc] <ontimeupdate> _media_offset: 5
[videojs.sc] <ontimeupdate> _media_offset: 6

*** user clicks on timeline at 95 seconds ***

[videojs.sc] <ontimeupdate> _media_offset: 95
[videojs.sc] <ontimeupdate> _media_offset: 95
[videojs.sc] <onpause> s.Media.stop (WRAL WeatherCenter Forecast, 95)
[videojs.sc] <ontimeupdate> _media_offset: 95
[videojs.sc] <onplay> s.Media.play (WRAL WeatherCenter Forecast, 95)
```

Notice that by the time the pause event is fired from videojs,  the user clicks the timeline, the media offset
is already 95.  So it looks like the user was already 95 seconds into the video when it stopped playing.

We *could* monitor the offset in the `ontimeupdate()` function and look for discontinuities to detect this sort of
timeline jump (and then use the last "good" offset in teh call to `s.Media.stop()`.  But I don't think this will affect
analytics gathering by SiteCatalyst, and I'm not sure the events will fire like this if videojs is using an HTML5
player, so I have not taken steps to address it.