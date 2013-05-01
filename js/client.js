$(document).ready(init);

// JsSip SIP User Agent
var sipUA;

// Initial panel setup
function init() {
    $("#registerButton").click(register);
    $("#unregisterButton").click(unregister).hide();    
    $("#connectButton").click(connect);
    $("#connectButton").attr("disabled", "disabled");
    $("#disconnectButton").click(disconnect).hide();
    $("#sendText").click(sendMessage);
    $("#sendText").attr("disabled", "disabled");
    $("#migrateButton").click(migrate);
    $("#migrateButton").attr("disabled", "disabled");
    $("#acceptButton").attr("disabled", "disabled");
}
	
// Register on SIP server
function register(){		
	var id = $("#pc1_id").val();
	var uri = 'sip:' + id + '@officesip.local';
	var configuration = {
		'ws_servers' : 'ws://192.168.148.100:5060',
		'uri' : uri,
		'register' : true,				
		'trace_sip': true
	};
		
	sipUA = new JsSIP.UA(configuration);		

	sipUA.on('registered', function (e) {
		$("#registrationInfo").html(" Registered, ID: " + id);
	});

	sipUA.on('unregistered', function (e) {
		$("#registrationInfo").html(" Not registered");
	});

	sipUA.on('registrationFailed', function(e) {
		$("#registrationInfo").html(" Not registered");
	});	
		
	sipUA.on('newRTCSession', function(e) {
		var request = e.data.request;
		var session = e.data.session;
		if(e.data.originator === "local"){				
		    log("Connecting to " + $("#pc2_id").val() + " ...");
		}else {
			var display_name = request.from.display_name || request.from.uri.user;
			log("Incoming request from " + display_name);

			var eventHandlers = {
			    'progress': function (e) { log("> in progress"); },
			    'failed': function (e) { log("> failed!"); $("#connectButton").removeAttr("disabled"); },
			    'started': channelEstablished,
			    'ended': channelClosed
			};

			var options = {
			    'eventHandlers': eventHandlers
			};

			session.answer(options);
		}			
	});
	$("#registerButton").hide();
	$("#unregisterButton").show();
	$("#connectButton").removeAttr("disabled");
	sipUA.start();
	return false;
}

// Unregister on SIP server
function unregister() {
    $("#registerButton").show();
    $("#unregisterButton").hide();
    $("#connectButton").show().attr("disabled", "disabled");
    $("#disonnectButton").hide();
    $("#sendText").attr("disabled", "disabled");
    $("#migrateButton").attr("disabled", "disabled");
    $("#acceptButton").attr("disabled", "disabled");
    sipUA.stop();
    return false;
}
	
// Initialize RTCDatachannel
function connect() {
    $("#connectButton").attr("disabled", "disabled");
	$("#datawindow").empty();
	
	var id = $("#pc2_id").val();
	var uri = 'sip:' + id + '@officesip.local';		
		
	var eventHandlers = {
	    'progress': function(e){ log("> in progress"); },
	    'failed': function (e) { log("> failed!"); $("#connectButton").removeAttr("disabled"); },
	    'started': channelEstablished,
	    'ended':  channelClosed
	};

	var options = {
		'eventHandlers': eventHandlers
	};

	sipUA.connectDataChannel(uri, options);
	return false;
}

// on RTCSession connected function
var channelEstablished = function (e) {
    $("#sendText").removeAttr("disabled");
    $("#migrateButton").removeAttr("disabled");
    $("#connectButton").removeAttr("disabled").hide();
    $("#disconnectButton").show();
    log("> connected!");
    sipUA.dataChannel.onmessage = function (e) {
        log("received: " + e.data);
    }
}

// Close RTCDatachannel
function disconnect() {
    sipUA.closeDataChannel();    
    return false;
}

// on RTCSession ended function
var channelClosed = function(e){
    $("#disconnectButton").hide();
    $("#connectButton").show();
    $("#sendText").attr("disabled", "disabled");
    $("#migrateButton").attr("disabled", "disabled");
    $("#acceptButton").attr("disabled", "disabled");
    log("> closed!");
}

// send Text chat message
function sendMessage(){
    log("<p>sent: " + $("#pcInput").val() + "</p>");
    sipUA.dataChannel.send($("#pcInput").val());
	return false;
}

// Output text to log window
function log(text) {	    
	$("#datawindow").append("<p>" + text + "</p>");
}