// Include the new and improved Twilio Cloud Code module,
// The express web framework, your and account config
var twilio = require('cloud/twilio/index'),
    express = require('express'),
    config = require('cloud/config');

// Create an express webapp for Twilio to talk to
var app = express();
app.use(express.bodyParser());

// Handle an HTTP request from Twilio to route a call
app.post('/zovnime', function(request,response) {
    // Create a TwiML object which will tell Twilio how to route the call
    var twiml = new twilio.TwimlResponse();
    // Set the content type of our ultimate response
    response.type('text/xml');

    // If this is a subsequent request from Twilio, figure out what happened
    // on the last call.
    var callStatus = request.param('DialCallStatus');
    if (callStatus && callStatus === 'completed') {
        // If we completed the call - say goodbye on this time
        twiml.say('Thanks for calling Preak Phone!')
            .say('Goodbye!',{voice:'woman'});
        response.send(twiml.toString());
    } else {
        //otherwise, continue to try and route the call
        // Execute logic to determine how the call should be routed
        var query = new Parse.Query(Parse.User);
        query.equalTo('available',true);

        // Eliminate agents we've already attempted
        var agentTriedString = request.param('agentsTried')||'';
        var agentIds = agentTriedString.split(',');
        query.notContainedIn('username',agentIds);

        // Find all agents we haven't tried
        query.find({
            success: function(results) {
                // Try the first available agent
                var agent = results[0];
                if (agent) {
                    var agentUsername = agent.get('username');
                    twiml.dial({
                        action:'/zovnime?agentsTried='+agentUsername+','+agentTriedString
                    }, function(parentNode) {
                        parentNode.client(agentUsername);
                    });
                } else {
                    // This is the fall-through case if there are no available agents.
                    // In a later iteration of this demo, we will add these callers to
                    // a queue to wait for an available agent, but for now, we ask them
                    // to call back later
                    twiml.say('We could not reach any agents. Please call back later sorry. Agents Almir and Djemi are occupate');
                }

                // Send the XML response
                response.send(twiml.toString());
            },

            // error finding list of agents
            error: function(error) {
                twiml.say('Sorry, an error has occurred - please call back later');
                response.send(twiml.toString());
            }
        });
    }
    
});


app.post('/zovnime?makeCall', function(request,response){
	// Create a TwiML object which will tell Twilio how to route the call
    var twiml = new twilio.TwimlResponse();
    // Set the content type of our ultimate response
    response.type('text/xml');
    
	var call = request.param('makeCall');
    console.log('makeCall');
    if(call == call){
    	 twiml.say('Thanks for calling Preak Phone!')
         .say('Goodbye!',{voice:'woman'});
         response.send(twiml.toString());
         console.log('makeCall');
    }else{
    	// this function let us to call from twilio number to 
        twiml.makeCall({
            to:'+41787052614', // Any number Twilio can call
            from: '+14846964711', // A number you bought from Twilio and can use for outbound communication
            url: '/zovnime?makeCall=call' //'http://www.example.com/twiml.php' // A URL that produces an XML document (TwiML) which contains instructions for the call

        }, function(err, responseData) {

            //executed when the call has been initiated.
            console.log(responseData.from); // outputs "+14506667788"

        });	
        twiml.say('In one moment the human person wil hang up to you, thanks.');
        response.send(twiml.toString());
    }
});

// Create an authenticated RPC function to generate a capability token
Parse.Cloud.define('generateToken', function(request, response) {
    if (request.user) {
        // Set up a capability token for VoIP usage
        var capability = new twilio.Capability(
            config.twilio.accountSid,
            config.twilio.authToken
        );
        capability.allowClientIncoming(request.user.get('username'));
        
        capability.allowClientOutcoming(request.user.get('username'));

        // return the token to the client
        response.success(capability.generate());
        
    } else {
        response.error('Login Required.');
    }
});

// start express dynamic web app
app.listen();
