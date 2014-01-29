var Twilio = function() {
	var g = function() {
		function a(b, e) {
			b = b || [];
			this.object = e || null;
			this.queue = [];
			for (var d = 0; d < b.length; d++)
				this.addCommand(b[d]);
		}
		a.prototype.run = function(b) {
			for (var e = 0; e < this.queue.length; e++) {
				var d = this.queue[e], a = b[d.name].apply(b, d.args);
				d.proxy && d.proxy.run(a);
			}
			this.object = b;
			this.queue = [];
		};
		a.prototype.addCommand = function(b, a) {
			var d = this;
			this[b] = function() {
				if (d.object)
					return d.object[b].apply(d.object, arguments);
				var c = a ? a() : null;
				d.queue.push({
					name : b,
					args : arguments,
					proxy : c
				});
				return c;
			};
		};
		return a;
	}(), f = new g(
			"setup disconnectAll disconnect presence status ready error offline incoming destroy cancel showPermissionsDialog"
					.split(" "));
	f.addCommand("status", function() {
		return "offline";
	});
	f.addCommand("connect", function() {
		var a = new g("accept disconnect error mute unmute sendDigits"
				.split(" "));
		a.addCommand("status", function() {
			return "pending";
		});
		return a;
	});
	var h = new g("setup incoming ready offline sms call twiml error"
			.split(" ")), k = function() {
		for (var a = document.createElement("a"), b = document
				.getElementsByTagName("script"), c = 0; c < b.length; c++)
			if (a.href = b[c].src, /(twilio\.js)|(twilio\.min\.js)$/
					.test(a.pathname))
				return {
					host : a.host,
					minified : /\.min\.js$/.test(a.pathname)
				};
	}(), m = k.minified ? "/twilio.min.js" : "/twilio.js", l = document
			.getElementsByTagName("script")[0], c = document
			.createElement("script");
	c.type = "text/javascript";
	c.src = "//" + k.host + "/libs/twiliojs/refs/e02c42e" + m;
	c.onload = c.onreadystatechange = function() {
		if (!c.readyState || "loaded" == c.readyState)
			f.run(Twilio.Device), h.run(Twilio.EventStream);
	};
	l.parentNode.insertBefore(c, l);
	return {
		Device : f,
		EventStream : h
	};
}();