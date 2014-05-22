;(function ($, window, undefined) {
  'use strict';

  var $doc = $(document),
      Modernizr = window.Modernizr;

  $(document).ready(function() {
    $.fn.foundationAlerts           ? $doc.foundationAlerts() : null;
    $.fn.foundationButtons          ? $doc.foundationButtons() : null;
    $.fn.foundationAccordion        ? $doc.foundationAccordion() : null;
    $.fn.foundationNavigation       ? $doc.foundationNavigation() : null;
    $.fn.foundationTopBar           ? $doc.foundationTopBar() : null;
    $.fn.foundationCustomForms      ? $doc.foundationCustomForms() : null;
    $.fn.foundationMediaQueryViewer ? $doc.foundationMediaQueryViewer() : null;
    $.fn.foundationTabs             ? $doc.foundationTabs({callback : $.foundation.customForms.appendCustomMarkup}) : null;
    $.fn.foundationTooltips         ? $doc.foundationTooltips() : null;
    $.fn.foundationMagellan         ? $doc.foundationMagellan() : null;
    $.fn.foundationClearing         ? $doc.foundationClearing() : null;

    $.fn.placeholder                ? $('input, textarea').placeholder() : null;
  });

  // UNCOMMENT THE LINE YOU WANT BELOW IF YOU WANT IE8 SUPPORT AND ARE USING .block-grids
  // $('.block-grid.two-up>li:nth-child(2n+1)').css({clear: 'both'});
  // $('.block-grid.three-up>li:nth-child(3n+1)').css({clear: 'both'});
  // $('.block-grid.four-up>li:nth-child(4n+1)').css({clear: 'both'});
  // $('.block-grid.five-up>li:nth-child(5n+1)').css({clear: 'both'});

  // Hide address bar on mobile devices (except if #hash present, so we don't mess up deep linking).
  if (Modernizr.touch && !window.location.hash) {
    $(window).load(function () {
      setTimeout(function () {
        window.scrollTo(0, 1);
      }, 0);
    });
  }

})(jQuery, this);

function erreurAjax(xhr, etat, erreur) {
	// avec un message dans l'element #resultat
	// traitement du resultat du chargement via Ajax
	var message = 'Anomalie : ' + (etat?etat+',':'') +
	'HTTP ' + xhr.status + ' ' + xhr.statusText + ' ' + ( ('undefined' != typeof erreur) ?
	    ', ' + erreur.toString() : '' );
	 $('#resultat').append('<p>' + message + '</p>');
}

//ZD fonction clavier du téléphone
$(function(request,response){
    var $write = $('#write');
    var phone = "";
    var call = false;
    $(document).ready(function() {
        $('button').click(function() {
        	var $this = $(this),
            character = $this.html();
        	var html = $write.html();
        	
        	// Delete
        	if (character == 'Reset' ) {
        	    $write.html(html.substr(0, html.length - 1));
        	    return false;
        	} else if (character == 'Call'){
        		character = "";
        		call = true;
        	}
        	
        	$write.html($write.html() + character);
        	phone = phone + character;
        	
        	if(call){
        		makeCall(phone);
        		
        	}
        });
    });
});

function makeCall(phone){
    console.log("phone " + phone);
}

function closeModal() {
  // The popup is powered by the Reveal plugin
  $("#add-quote").trigger("reveal:close");
}

// cette fonction initialise 
$(function() {
    // Initialize Parse SDK
	// ZD 26.01.14 From parse.com first one is ApplicationID and the second one is JavaScript ID key
	// You must have a account one parse.com the make work this example application
    Parse.initialize(
        '31JqtMGLuFN0GbrC07UIJXMIE8X1kKBoVvWLXJBB', 
        'EgEs2Vnfh6BRSrIeZh0Qc0lA6EcjOb4Sak3VlQsb'
    );

    // initialize app from the given user
    function initFromUser(user) {
        // get latest user data
        user.fetch({
            success: function(user) {
                // Set username
                $('#loggedInUser').html(user.get('username'));

                // Populate availability status
                if (!user.get('available')) {
                    $('input[name=available][value=no]').attr('checked',true);
                }

                // Generate a VoIP capability token
                Parse.Cloud.run('generateToken',null, {
                    success: function(token) {
                        // Configure our soft phone with a capability token which allows
                        // for incoming phone calls.
                        Twilio.Device.setup(token);
                    },
                    error: function(message) {
                        alert('token generation failed: ' + message);
                    }
                });
            },
            error: function() {
                alert('problem fetching latest user data');
            }
        });
    }

    // Display login if we don't have a logged in user, otherwise display main
    // call center UI
    if (Parse.User.current()) {
        initFromUser(Parse.User.current());
        $('#main').fadeIn();
    } else {
        $('#container').fadeIn();//$('#login').fadeIn();
    }

    // Logic to handle the login form
    var $loginForm = $('#form-signin'); //$('#loginForm');
    $loginForm.submit(function(e) {
        e.preventDefault();
        Parse.User.logIn(
            $loginForm.find('input[type=text]').val(),
            $loginForm.find('input[type=password]').val(), 
            {
                success: function(user) {
                    // Set up user name for current user
                    initFromUser(user);

                    // Manipulate UI $('#login').fadeOut(function()
                    $('#container').fadeOut(function() {
                        $('#main').fadeIn();
                        $loginForm.find('input[type=text]').val('');
                        $loginForm.find('input[type=password]').val('');
                    });
                },
                error: function() {
                    alert('sorry, couldn\'t log you in');
                }
            }
        );
    });

    // Logic to handle the call center agent UI
    $('#logout').on('click', function(e) {
        Parse.User.logOut();
        $('#main').fadeOut(function() {
            $('#container').fadeIn(); //$('#login').fadeIn();
        });
    });

    // Handle the current state for the agent of this call center
    $('input[name=available]').change(function() {
        var available = $('input[name=available]:checked').val();
        var currentUser = Parse.User.current();
        currentUser.set('available', available === 'yes');
        currentUser.save(null, {
            success: function(user) {
                if (currentUser.get('available')) {
                    alert('You are now available to take calls.');
                } else {
                    alert('You are now unavailable.');
                }
            },
            error: function() {
                alert('There was an error updating your status.');
            }
        });
    });

    // Handle an inbound call in the browser
    Twilio.Device.incoming(function(connection) {
        // Accept the incoming call automatically
        connection.accept();

        // update status as busy
        var currentUser = Parse.User.current();
        currentUser.set('available', false);
        currentUser.save(null, {
            success: function(user) {
                // nothing for now
            },
            error: function() {
                alert('There was an error updating your status.');
            }
        });
    });
    
 // Handle an outbound call in the browser
    Twilio.Device.outbound(function(connection) {
        // Accept the incoming call automatically
        connection.accept();

        // update status as busy
        var currentUser = Parse.User.current();
        currentUser.set('available', false);
        currentUser.save(null, {
            success: function(user) {
                // nothing for now
            },
            error: function() {
                alert('There was an error updating your status.');
            }
        });
    });
});