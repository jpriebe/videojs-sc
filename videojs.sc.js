/*
* videojs-sc - v0.1.1 - 2016-02-10
*
*/
(function() {

  videojs.plugin('sc', function(options) {

    // controls debug logging
    var _verbosity = options.verbosity || 0;

    // callback used by the plugin to obtain information about the video when a new video is started;
    // should return an object like this:
    // {
    //   "name": "Name of video",
    //   "channel": "Channel to which video belongs",
    //   "props": {
    //     "prop10": "value for prop10",
    //     "prop11": "value for prop11",
    //     ...
    //     "propN": "value for propN"
    //   }
    // }
    var _on_new_video_cb = options.new_video_cb || null;

    // custom event to track for "new video" rather than loadedmetadata; e.g., "vast.contentStart"
    // (if you're using the VAST plugin, you'll get a loadedmetadata event on the main content video
    // right away, even before the preroll ad plays; you don't want to start tracking the video at
    // that point -- you want to wait until VAST is done with the preroll and is playing the content video)
    var _new_video_event = options.new_video_event || "loadedmetadata";

    // name of the video player (used in s.Media.open()
    var _media_player_name = options.player_name || 'VideoJS';

    // a reference to the s object
    var _sc = options.sc || null;

    var _media_info = null;

    var _media_name = '';
    var _media_length = 0;

    var _media_offset = 0;

    function logmsg (msg, level)
    {
      if (typeof level === "undefined")
      {
        level = 1;
      }

      if (_verbosity < level)
      {
        return;
      }

      msg = "[videojs.sc] " + msg;
      console.log (msg);
    }


    function onnewvideo (e) {

      if (_media_info !== null)
      {
        // if a new video starts up, and we haven't cleared out the _media_info, we
        // need to force an "end" event.
        onended (e);
      }

      _media_info = _on_new_video_cb ();
      _media_name = _media_info.name;
      _media_length = Math.round(this.duration ());

      logmsg ("<" + _new_video_event + "> s.Media.open (" + _media_name + ", " + _media_length + ", " + _media_player_name + ")");

      _sc.pageName = _media_name;
      _sc.channel = _media_info.channel;
      logmsg ("  channel: " + _media_info.channel);

      if (typeof _media_info.props !== "undefined")
      {
        for (var k in _media_info.props)
        {
          logmsg ("  " + k + ": " + _media_info.props[k]);
          _sc[k] = _media_info.props[k];
        }
      }

      _sc.Media.open (_media_name, _media_length, _media_player_name);

      // if we're specifying a custom new video event (as opposed to the standard loadedmetadata event),
      // we're going to assume we need to send a play() call to s.Media.
      if (_new_video_event !== 'loadedmetadata')
      {
        _media_offset = Math.round(this.currentTime());
        logmsg ("<" + _new_video_event + "> s.Media.play (" + _media_name + ", " + _media_offset + ")");
        _sc.Media.play (_media_name, _media_offset);
      }
    }

    function ontimeupdate (e)
    {
      if (_media_info === null)
      {
        return;
      }

      _media_offset = Math.round(this.currentTime());
      logmsg ("<ontimeupdate> _media_offset: " + _media_offset, 2);
    }

    function onplay (e)
    {
      if (_media_info === null)
      {
        return;
      }

      _media_offset = Math.round(this.currentTime());
      logmsg ("<onplay> s.Media.play (" + _media_name + ", " + _media_offset + ")");
      _sc.Media.play (_media_name, _media_offset);

    }

    function onpause (e)
    {
      if (_media_info === null)
      {
        return;
      }

      _media_offset = Math.round(this.currentTime());
      logmsg ("<onpause> s.Media.stop (" + _media_name + ", " + _media_offset + ")");
      _sc.Media.stop (_media_name, _media_offset);
    }

    function onended (e)
    {
      if (_media_info === null)
      {
        return;
      }

      logmsg ("<onended> s.Media.close (" + _media_name + ")");
      _sc.Media.close (_media_name);
      _media_info = null;
    }

    this.ready (function()
    {
      if (_sc.Media === null)
      {
        console.error ("ERROR: no site catalyst object in options.sc; not tracking events.");
        return;
      }

      if (_on_new_video_cb === null)
      {
        console.error ("ERROR: no new video callback specified; not tracking events.");
        return;
      }

      this.on (_new_video_event, onnewvideo);
      this.on ("timeupdate", ontimeupdate);
      this.on ("play", onplay);
      this.on ("pause", onpause);
      this.on ("ended", onended);
    });
    
    

  });

}).call(this);
