var DEVICE_MODEL = "standard";
var QLIST_SEND_SEPARATOR = 46;
var QLIST_RECEIVE_SEPARATOR = 46;
var QLIST_SEND_OFFSET = 0;
var QLIST_RECEIVE_OFFSET = 0;
var LISTEN = "nothing";

var msc_command_format = {
  "(7FH) All-Types": 127,
  "(1H) Lighting (General Category)": 1,
  "(2H) Moving Lights": 2,
  "(3H) Colour Changers": 3,
  "(4H) Strobes": 4,
  "(5H) Lasers": 5,
  "(6H) Chasers": 6,
  "(10H) Sound (General Category)": 16,
  "(11H) Music": 17,
  "(12H) CD Players": 18,
  "(13H) EPROM Playback": 19,
  "(14H) Audio Tape Machines": 20,
  "(15H) Intercoms": 21,
  "(16H) Amplifiers": 22,
  "(17H) Audio Effects Devices": 23,
  "(18H) Equalisers": 24,
  "(20H) Machinery (General Category)": 32,
  "(21H) Rigging": 33,
  "(22H) Flys": 34,
  "(23H) Lifts": 35,
  "(24H) Turntables": 36,
  "(25H) Trusses": 37,
  "(26H) Robots": 38,
  "(28H) Animation": 39,
  "(28H) Floats": 40,
  "(29H) Breakaways": 41,
  "(2AH) Barges": 42,
  "(30H) Video (General Category)": 48,
  "(31H) Video Tape Machines": 49,
  "(32H) Video Cassette Machines": 50,
  "(33H) Video Disc Players": 51,
  "(34H) Video Switchers": 52,
  "(35H) Video Effects": 53,
  "(36H) Video Character Generators": 54,
  "(37H) Video Still Stores": 55,
  "(38H) Video Monitors": 56,
  "(40H) Projection (General Category)": 64,
  "(41H) Film Projectors": 65,
  "(42H) Slide Projectors": 66,
  "(43H) Video Projectors": 67,
  "(44H) Dissolvers": 68,
  "(45H) Shutter Controls": 69,
  "(50H) Process Control (General Category)": 80,
  "(51H) Hydraulic Oil": 81,
  "(52H) H20": 82,
  "(53H) CO2": 83,
  "(54H) Compressed Air": 84,
  "(55H) Natural Gas": 85,
  "(56H) Fog": 86,
  "(57H) Smoke": 87,
  "(58H) Cracked Haze": 88,
  "(60H) Pyro (General Category)": 96,
  "(61H) Fireworks": 97,
  "(62H) Explosions": 98,
  "(63H) Flame": 99,
  "(64H) Smoke pots": 100
};

/* **********************
          Utils
  *********************** */
/**
 * Util for dev to display an array in the log instead of using JSON.stringify
 * @param {array} array 
 * @param {string} title 
 */
function logArray(array, title) {
  script.log("==============");
  script.log("-   "+title);
  script.log("==============");
  for (i=0; i< array.length; i++) {
    script.log("- "+i+" : "+ array[i]);
  }
}

/**
 * Convert the ascii sent value to a number (48 in decimals = 30 in ascii = 0; 57 in decimals = 39 in ascii = 9)
 * @param {int} int 
 * @returns {int} the number
 */
function asciiNbrToInt(int) {
  // yes, just remove the 3 (30=0; 39=9...)
  return parseInt(Integer.toHexString(int).substring(1,2))
}

/**
 * Generate an object containing computed names for containers and parameters
 * @param {int} qlist_main 
 * @param {int} qlist_sub 
 * @param {string} type 
 * @returns {object}
 */
function getNames(qlist_main, qlist_sub, type) {
  var names = {"container":{}, "parameter":{}};
  names.container.shortname = "qlist"+ qlist_main+ "_"+ qlist_sub;
  names.container.name = "Q List "+ qlist_main+ "_"+ qlist_sub;
  names.parameter.shortname = names.container.shortname+ type;
  names.parameter.name = names.container.name+ " "+ type;
  return names;
}

/**
 * Dynamically add items to parameters that can not be added in the module.json file
 * @param {object} param 
 * @param {object} options 
 * @param {int} value 
 */
function enumAddOptions(param, options, value) {
	if (param.getOptionAt(1) == undefined) {
		var paramToLink = param.getParent();
		paramToLink.loadJSONData({
			"parameters": [
				{
					"value": value,
					"enumOptions": options,
					"controlAddress": "/" + param.name,
					"feedbackOnly": false,
					"type": "Enum",
					"customizable": true,
					"removable": false,
					"hideInEditor": false
				}
			]
		});
    param.setData(127);
	}
}

/**
 * Get the send or receive path
 * @param {string}} path 
 * @returns 
 */
function sendOrReceive(path) {
  var array = path.split("/");
  return array[array.length -2];
}

/**
 * Generate a link to a module's value
 * @param {object} parent 
 * @param {string} module_value_path 
 * @param {string} type 
 * @param {string} shortname 
 * @param {string} name 
 * @param {string} description 
 * @returns the parameter containing the link
 */
function generateLinkToModuleValue(parent, module_value_path, type, shortname, name, description) {

  var int_min = 0;
  var int_max = 100;
  if (["QMain", "QSub"].contains(type)) {
    int_max = 999;
  }
  if (["Hour", "Minute", "second"].contains(type)) {
    int_max = 60;
  }
  if (["Frame", "SubFrame"].contains(type)) {
    int_max = 100;
  }

  var param_type = "Int Parameter";
  var param_value_type = "Integer";
  if (["Go", "Stop", "Resume", "GoOff"].contains(type)) {
    param_type = "Bool Parameter";
    param_value_type = "Boolean";
  }
  var my_value_item = parent.addItem(param_type);
  var my_value = my_value_item.getChild(my_value_item.name);
  if (!["Go", "Stop", "Resume", "GoOff"].contains(type)) {
    my_value.setRange(0,int_max);
  }

  my_value_item.loadJSONData({
    "parameters": [
      {
        "value": 0,
        "controlMode": 2,
        "reference": {
          "value": module_value_path,
          "controlAddress": "/reference"
        },
        "hexMode": false,
        "controlAddress": "/"+ shortname,
        "feedbackOnly": false,
        "type": param_value_type,
        "niceName": name,
        "customizable": true,
        "removable": false,
        "description": description,
        "hideInEditor": false
      }
    ],
    "niceName": name,
    "editorIsCollapsed": true,
    "type": param_type
  });

  return my_value_item;
}

/* **************************
      Parse sysex values
  *************************** */

/**
 * Parse the Q number from sysex
 * @param {array} values 
 * @returns {array}
 */
function parseQ(values) {
  var main = "";
  var sub = "";
  var separator_index = values.indexOf(46);
  if (separator_index != -1) {
    for (i=0; i< separator_index; i++) {
      main = main + asciiNbrToInt(values[i]);
    }
    for (i=(separator_index+ 1); i<values.length; i++) {
      sub = sub +  asciiNbrToInt(values[i]);
    }
    return [parseInt(main), parseInt(sub)];
  }
}

/**
 * Parse the Q number and Q list from sysex
 * @param {array} values 
 * @returns 
 */
function parseQs(values) {
  var separator_index = values.indexOf(0);
  if (separator_index == -1) {
    // there is only Q_number
    return [parseQ(values), [0,0]];
  }
  else {
    // check if there is Q_list
    var Q_number = values.splice(0, separator_index);
    var trailing = values.splice(1, values.length);
    // check if there is a Q_path
    var second_separator = trailing.indexOf(0);
    if (second_separator == -1) {
      // there is no Q_path
      return [parseQ(Q_number), parseQ(trailing)];
    }
    // TODO : manage Q_path
  }
}

/**
 * Parse the GO command
 * @param {array} values 
 */
function parseCommandGo(values) {
  var parsed = parseQs(values);
  setModuleValue(parsed[1][1], parsed[1][0], "Go", false);
  setModuleValue(parsed[1][1], parsed[1][0], "QMain", parsed[0][0]);
  setModuleValue(parsed[1][1], parsed[1][0], "QSub", parsed[0][1]);
}

/**
 * Parse the STOP command
 * @param {array} values 
 */
function parseCommandStop(values) {
  var parsed = parseQs(values);
  setModuleValue(parsed[1][1], parsed[1][0], "Stop", false);
  setModuleValue(parsed[1][1], parsed[1][0], "QMain", parsed[0][0]);
  setModuleValue(parsed[1][1], parsed[1][0], "QSub", parsed[0][1]);
}

/**
 * Parse the RESUME command
 * @param {array} values 
 */
function parseCommandResume(values) {
  var parsed = parseQs(values);
  setModuleValue(parsed[1][1], parsed[1][0], "Resume", false);
  setModuleValue(parsed[1][1], parsed[1][0], "QMain", parsed[0][0]);
  setModuleValue(parsed[1][1], parsed[1][0], "QSub", parsed[0][1]);
}

/**
 * Parse the TIMED GO command
 * @param {array} values 
 */
function parseCommandTimedGo(values) {
  // get Qs
  var parsed = parseQs(values.splice(5, values.length));
  // set values
  setModuleValue(parsed[1][1], parsed[1][0], "TimedGo", false);
  setModuleValue(parsed[1][1], parsed[1][0], "QMain", parsed[0][0]);
  setModuleValue(parsed[1][1], parsed[1][0], "QSub", parsed[0][1]);
  setModuleValue(parsed[1][1], parsed[1][0], "Hour", values[0]);
  setModuleValue(parsed[1][1], parsed[1][0], "Minute", values[1]);
  setModuleValue(parsed[1][1], parsed[1][0], "Second", values[2]);
  setModuleValue(parsed[1][1], parsed[1][0], "Frames", values[3]);
  setModuleValue(parsed[1][1], parsed[1][0], "SubFrames", values[4]);
}

/**
 * Parse the SET command
 * @param {array} values 
 */
function parseCommandSet(values) {
  var q_list_main = values[1];
  var q_list_sub = values[0]+ local.parameters.deviceParameters.receive.qListOffset.get();
  setModuleValue(
    q_list_main,
    q_list_sub,
    "FaderLevel",
    coarseFineToFaderLevel(values[3], values[2])
  );
  if (values.length > 4) {
    setModuleValue(q_list_main, q_list_sub, "Hour", values[4]);
    setModuleValue(q_list_main, q_list_sub, "Minute", values[5]);
    setModuleValue(q_list_main, q_list_sub, "Second", values[6]);
    setModuleValue(q_list_main, q_list_sub, "Frames", values[7]);
    setModuleValue(q_list_main, q_list_sub, "SubFrames", values[8]);
  }
}

/**
 * Parse the FIRE command
 * @param {array} values 
 */
function parseCommandFire(values) {
  setModuleValue(0,0, "Fire", values[0]);
}

/**
 * Parse the RESET command
 * @param {array} values 
 * @returns 
 */
function parseCommandReset(values) {
  // TODO
  return;
}

/**
 * Parse the GO OFF command
 * @param {array} values 
 */
function parseCommandGoOff(values) {
  var parsed = parseQs(values);
  setModuleValue(parsed[1][1], parsed[1][0], "GoOff", false);
  setModuleValue(parsed[1][1], parsed[1][0], "QMain", parsed[0][0]);
  setModuleValue(parsed[1][1], parsed[1][0], "QSub", parsed[0][1]);
}

/**
 * Route the command to the method
 * @param {array} data 
 */
function parseCommand(data) {
  var command = data[0];
  var values = data.splice(1, data.length);
  if (command == 1) {
    parseCommandGo(values);
  }
  else if (command == 2) {
    parseCommandStop(values);
  }
  else if (command == 3) {
    parseCommandResume(values);
  }
  else if (command == 4) {
    parseCommandTimedGo(values);
  }/*
  else if (command == 5) {
    parseCommandLoad(values);
  }*/
  else if (command == 6) {
    parseCommandSet(values);
  }
  else if (command == 7) {
    parseCommandFire(values);
  }/*
  else if (command == 8) {
    parseCommandAllOff(values);
  }
  else if (command == 9) {
    parseCommandRestore(values);
  }*/
  else if (command == 10) {
    if (DEVICE_MODEL == "grandma2") {
      parseCommandGoOff(values);
    }
    else {
      parseCommandReset(values);
    }
  }/*
  else if (command == 11) {
    parseCommandGoOff(values);
  }
  else if (command == 16) {
    parseCommandGoJamClock(values);
  }
  else if (command == 17) {
    parseCommandStandbyPlus(values);
  }
  else if (command == 18) {
    parseCommandStandbyMinus(values);
  }
  else if (command == 19) {
    parseCommandSequencePlus(values);
  }
  else if (command == 20) {
    parseCommandSequenceMinus(values);
  }
  else if (command == 21) {
    parseCommandStartClock(values);
  }
  else if (command == 22) {
    parseCommandStopClock(values);
  }
  else if (command == 23) {
    parseCommandZeroClock(values);
  }
  else if (command == 24) {
    parseCommandSetClock(values);
  }
  else if (command == 25) {
    parseCommandMTCChaseOn(values);
  }
  else if (command == 26) {
    parseCommandMTCChaseOff(values);
  }
  else if (command == 27) {
    parseCommandOpenCueList(values);
  }
  else if (command == 28) {
    parseCommandCloseCueList(values);
  }
  else if (command == 29) {
    parseCommandOpenCuePath(values);
  }
  else if (command == 30) {
    parseCommandCloseCuePath(values);
  }*/
}

/**
 * Parse a sysex message
 * @param {array} sysex (the sysex message as array of bytes)
 */
function parseSysex(sysex) {

  // must be "realtime"
  if (sysex[0] != 127) return;

  // get the device_id
  if (sysex[1] != getSysexDeviceType(false) && getSysexDeviceType(false) != 127) return;

  // must be MSC
  if (sysex[2] != 2) return;

  // command_format
  if (sysex[3] != getSysexCommandFormat(false) && getSysexCommandFormat(false) != 127) return;

  // parse command
  parseCommand(sysex.splice(4, sysex.length));
}

/* **************************
    Fader level computation
  *************************** */

/**
 * Convert the hex values sent by the desk to 0 thru 100 level
 * @param {int} coarse (coarse value (byte 8))
 * @param {int} fine (fine value (byte 7))
 * @returns {int} (the fader level)
 */
function coarseFineToFaderLevel(coarse, fine) {
  if (coarse == 0 && fine == 0) {
    return 0;
  }
  else if (coarse == 127 && fine == 127) {
    return 100;
  }
  return Math.round((((fine / 128) + coarse) / 1.28));
  //return (((fine / 128) + coarse) / 1.28);
}

/**
 * Get coarse and fine values to be sent to sysex
 * @param {int} fader_level
 * @returns {array} 0=coarse / 1=fine
 */
function faderLevelToCoarseFine(fader_level) {
  if (fader_level == 0) return [0 ,0];
  if (fader_level == 100) return [127, 127];

  // multiply by 1.28
  var temp_coarse = fader_level * 1.28;

  // compute coarse (left side)
  var splitted = (""+temp_coarse).split('.');
  var coarse = parseInt(splitted[0]);

  // compute fine (right side * 128)
  var right_side = parseFloat("0."+(splitted[1]).substring(0,2));
  var temp_fine = right_side * 128;

  var fine = parseInt((""+temp_fine).split('.')[0]);

  return [coarse, fine];
}

/* **************************
          Module values
  *************************** */

/**
 * Returns the module values container if exists or create a new one
 * @param {string} name 
 * @param {string} shortname 
 * @returns {object}
 */
function getModuleValuesContainer(name, shortname) {
  var my_container = local.values.getChild(shortname);
  if (my_container == undefined) {
    if (LISTEN == "listen") return undefined; 
    // build a new container
    my_container = local.values.addContainer(name);
  }
  return my_container;
}

/**
 * Returns the module parameter path (control address)
 * @param {object} names (the names generated with getNames())
 * @returns {string}
 */
function GetModuleValueControlAddress(names) {
  // get the container
  var my_container = getModuleValuesContainer(names.container.name, names.container.shortname);
  // get the parameter
  var my_value = my_container.getChild(names.parameter.shortname);
  if (my_value == undefined) {
    return undefined;
  }
  return my_value.getControlAddress();
}

/**
 * Return the module value parameter or create it if not exists
 * @param {int} qlist_main 
 * @param {int} qlist_sub 
 * @param {string} type 
 * @param {*} value 
 * @returns {object}
 */
function setModuleValue(qlist_main, qlist_sub, type, value) {
  // init the default max range for integers
  var int_min = 0;
  var int_max = 100;

  // get names
  var names = getNames(qlist_main, qlist_sub, type);

  // get the container
  var my_container = getModuleValuesContainer(names.container.name, names.container.shortname);
  if (my_container == undefined && LISTEN == "listen") return undefined; 

  // get the parameter
  var my_value = my_container.getChild(names.parameter.shortname);
  if (my_value == undefined) {

    // return if listen mode
    if (LISTEN == "listen") return undefined; 

    // create if not exist
    if (["Go", "Stop", "Resume", "TimedGo", "GoOff"].contains(type)) {
      my_value = my_container.addBoolParameter(names.parameter.name, "", false);
    }
    else {
      // manage range for integers
      if (["QMain", "QSub"].contains(type)) {
        int_max = 999;
      }
      if (["Hour", "Minute", "second"].contains(type)) {
        int_max = 60;
      }
      if (["Frame", "SubFrame"].contains(type)) {
        int_max = 100;
      }
      if (type == "Fire") {
        int_min = 1;
        int_max = 127;
      }
      my_value = my_container.addIntParameter(names.parameter.name, "", value, 0, int_max);
    }
    // make the value persistant between sessions
    my_value.setAttribute("saveValueOnly",false);
  }
  
  if (["Go", "Stop", "Resume", "TimedGo", "GoOff"].contains(type)) {
    // simulate a trigger :)
    my_value.set(true);
    my_value.set(false);
  }
  else {
    my_value.set(value);
  }
  return my_value;
}

/* **********************
        Auto Add
  *********************** */

/**
 * Parse received data and fill parameters
 * @param {array} data (sysex data received knowing that the first (f0) and the last one (f7) are truncated)
 * @param {object}
 */
function autoAdd(data) {
  parseSysex(data);

  // disable auto add if necessary
  if (LISTEN == "autoadd_single") {
    local.parameters.moduleParameters.listen.setData("listen");
  }
}

/* **********************
      Custom Vars
  *********************** */

/**
 * Return or create a custom variables group
 * @param {object} name (object generated from getNames())
 * @param {*} shortname of the group
 * @returns {object}
 */
function getCustomVariablesGroup(name, shortname) {
  var my_group = root.customVariables.getItemWithName(shortname);
  if (my_group.name != shortname) {
    // build a new group
    my_group = root.customVariables.addItem(shortname);
    my_group.setName(name);
  }
  return my_group;
}

/**
 * Set or create then set the custom variable value
 * @param {int} qlist_main 
 * @param {int} qlist_sub 
 * @param {int} value 
 * @param {string} type 
 * @param {object} group 
 */
function setCustomVariablesTarget(qlist_main, qlist_sub, type, group) {
  var names = getNames(qlist_main, qlist_sub, type);
  var module_value_path = undefined;
  var my_value_item = group.variables.getItemWithName(names.container.shortname);
  if (my_value_item.name == names.container.shortname) return;
  // check if the value exists in the module
  module_value_path = GetModuleValueControlAddress(names);
  // if not, create it  
  if (module_value_path == undefined) {
    var new_value = setModuleValue(qlist_main, qlist_sub, type, 0);
    module_value_path = new_value.getControlAddress();
  }
  // create if not exist
  generateLinkToModuleValue(group.variables, module_value_path, type, names.parameter.shortname, names.parameter.name, "");
}

/* **********************
        Generators
  *********************** */

/**
 * Generate Execs in custom vars so in module vars too
 * @param {int} qty 
 * @param {int} qlist_main 
 * @param {int} qlist_sub 
 */
function generateQLists(qty, qlist_main, qlist_sub) {
  if (LISTEN == "listen") {
    util.showMessageBox("Listen activated", "To use generators, you need to disable \"Listen\"", "warning", "Got it");
    return;
  }
  if (qty < 1) return;
  var group = undefined;
  for (i=0; i<qty; i++) {
    // set the level
    qlist_sub = qlist_sub+ i;
    // get the group
    group = getCustomVariablesGroup("Exec "+qlist_main+ "_"+ qlist_sub , "Exec "+qlist_main+ "_"+ qlist_sub);
    // add items
    setCustomVariablesTarget(qlist_main, qlist_sub, "Go", group);
    setCustomVariablesTarget(qlist_main, qlist_sub, "Stop", group);
    setCustomVariablesTarget(qlist_main, qlist_sub, "Resume", group);
    setCustomVariablesTarget(qlist_main, qlist_sub, "GoOff", group);
    setCustomVariablesTarget(qlist_main, qlist_sub, "FaderLevel", group);
    setCustomVariablesTarget(qlist_main, qlist_sub, "QMain", group);
    setCustomVariablesTarget(qlist_main, qlist_sub, "QSub", group);
  }
}

/**
 * Generate custom vars group with the same kind of items (ex: i want 6 fader levels only)
 * @param {string} name The name of the group
 * @param {int} type Type of items
 * @param {int} qty 
 * @param {int} qlist_main 
 * @param {int} qlist_sub 
 * @returns 
 */
function fillCustomVariablesGroup(name, type, qty, qlist_main, qlist_sub) {
  if (LISTEN == "listen") {
    util.showMessageBox("Listen activated", "To use generators, you need to disable \"Listen\"", "warning", "Got it");
    return;
  }
  if (qty < 1) return;

  // get the group
  var group = getCustomVariablesGroup(name, name);

  // the loop
  for (i=0; i<qty; i++) {
    setCustomVariablesTarget(qlist_main, (qlist_sub+i), type, group);
  }
}

/* **********************
      Send callbacks
  *********************** */

/**
 * Check sysex values and then send them
 * @param {array} sysex 
 * @returns if message is too long
 */
function sendCommand(sysex) {
  if (sysex.length > 125) {
    script.logWarning("Message not sent : too long");
    return;
  }

  // faya !!
  local.sendSysex(sysex);
}

/**
 * Convert the device type to integer
 * @param {bool} send 
 * @returns {int}
 */
function getSysexDeviceType(send) {
  var value = 127;
  var way = send ? local.parameters.deviceParameters.send: local.parameters.deviceParameters.receive;
  var device_type = way.deviceType.get();
  if (device_type == "group") {
    value = way.group.get()+ 111;
  }
  else if (device_type == "device") {
    value = way.device.get();
  }
  return value;
}

/**
 * Convert the command format to integer
 * @param {bool} send 
 * @returns {int}
 */
function getSysexCommandFormat(send) {
  var way = send ? local.parameters.deviceParameters.send: local.parameters.deviceParameters.receive;
  return way.commandFormat.get();
}

/**
 * Add the device infos to the sysex output
 * @returns {array} The sysex values computed as an array
 */
function setDeviceSysex() {
  var sysex = [];

  // realtime
  sysex[0] = 127;

  // device type
  sysex[1] = getSysexDeviceType(true);

  // set msc
  sysex[2] = 2;

  // command format
  sysex[3] = getSysexCommandFormat(true);

  return sysex;
}

/**
 * Add the cue infos to the sysex output
 * @param {array} sysex 
 * @param {int} q_main 
 * @param {int} q_sub 
 * @returns {array} The sysex values computed as an array
 */
function addQToSysex(sysex, q_main, q_sub) {
  // convert cue msb to a string
  var q_main_string = q_main+ "";
  // separate cue to items
  var q_main_items = q_main_string.split('');
  // generate sysex for each item
  for (i=0; i<q_main_items.length; i++) {
    // convert to hex and then to integer
    sysex[sysex.length] = charToInt(q_main_items[i]);
  }

  // add a dot
  sysex[sysex.length] = 46;

  // convert cue msb to a string
  var q_sub_string = q_sub+ "";
  // separate cue to items
  var q_sub_items = q_sub_string.split('');
  // generate sysex for each item
  var q_sub_items_length = q_sub_items.length;
  for (i=0; i<q_sub_items_length; i++) {
    // convert to hex and then to integer
    sysex[sysex.length] = charToInt(q_sub_items[i]);
  }

  // add zero if needed
  if (q_sub_items_length < 3) {
    sysex[sysex.length] = 48;
  }
  // add zero if needed
  if (q_sub_items_length < 2) {
    sysex[sysex.length] = 48;
  }

  return sysex;
}

/**
 * Add the page and exec infos to the sysex output
 * @param {array} sysex 
 * @param {int} qlist_main 
 * @param {int} qlist_sub 
 * @returns {array} The sysex values computed as an array
 */
function addQListToSysex(sysex, qlist_main, qlist_sub) {
  qlist_sub = qlist_sub + QLIST_SEND_OFFSET;
  // convert the executor to string
  var qlist_sub_string = qlist_sub+ "";
  // separate to items
  var qlist_sub_items = qlist_sub_string.split('');
  // convert to hex and then to integer
  for (i=0; i<qlist_sub_items.length; i++) {
    sysex[sysex.length] = charToInt(qlist_sub_items[i]);
  }

  // compute the separator (dot or space)
  var separator = QLIST_SEND_SEPARATOR;
  if (DEVICE_MODEL == "grandma2") {
    // the doc says 32 but the machine returns 0
    //separator = 32;
    separator = 0;
  }
  sysex[sysex.length] = separator;

  // convert the page to string
  var qlist_main_string = qlist_main+ "";
  // separate to items
  var qlist_main_items = qlist_main_string.split('');
  // convert to hex and then to integer
  for (i=0; i<qlist_main_items.length; i++) {
    sysex[sysex.length] = charToInt(qlist_main_items[i]);
  }

  return sysex;
}

/**
 * Send a full sysex "Go" command
 * @param {int} q_main 
 * @param {int} q_sub 
 * @param {int} qlist_main 
 * @param {int} qlist_sub 
 * @param {boolean} use_time 
 * @param {int} time_hour 
 * @param {int} time_minute 
 * @param {int} time_second 
 */
function sendGo(send_time, time_hour, time_minute, time_second, time_frame, time_subframe, send_q_number, q_main, q_sub, send_q_list, qlist_main, qlist_sub) {
  var sysex = setDeviceSysex();

  if (send_time) {
    // command (timed go = 4)
    sysex[sysex.length] = 4;
    // add time
    sysex[sysex.length] = time_hour;
    sysex[sysex.length] = time_minute;
    sysex[sysex.length] = time_second;
    sysex[sysex.length] = time_frame;
    if (DEVICE_MODEL == "standard") {
      sysex[sysex.length] = time_subframe;
    }
    // add the separator
    sysex[sysex.length] = 0;
  }
  else {
    // command (go = 1)
    sysex[sysex.length] = 1;
  }

  // set Q number if needed
  if (send_q_number) {
    sysex = addQToSysex(sysex, q_main, q_sub);
    // set page and exec if needed
    if (send_q_list) {
      // add the separator
      sysex[sysex.length] = 0;
      // add page and exec
      sysex = addQListToSysex(sysex, qlist_main, qlist_sub);
    }
  }

  sendCommand(sysex);
}

/**
 * Send a full sysex "Stop" or "Resume" command
 * @param {boolean} stop_or_resume 
 * @param {int} qlist_main 
 * @param {int} qlist_sub 
 */
function sendStopResume(stop_or_resume, send_q_number, q_main, q_sub, send_q_list, qlist_main, qlist_sub) {
  var sysex = setDeviceSysex();

  if (stop_or_resume == "stop") {
    // command (stop = 2)
    sysex[sysex.length] = 2;
  }
  else {
    // command (resume = 3)
    sysex[sysex.length] = 3;
  }

  // set Q number if needed
  if (send_q_number) {
    sysex = addQToSysex(sysex, q_main, q_sub);
    // set page and exec if needed
    if (send_q_list) {
      // add the separator
      sysex[sysex.length] = 0;
      // add page and exec
      sysex = addQListToSysex(sysex, qlist_main, qlist_sub);
    }
  }

  sendCommand(sysex);
}

/**
 * Send a full sysex "Set" command
 * @param {int} fader_level
 * @param {int} qlist_main 
 * @param {int} qlist_sub 
 * @param {boolean} use_time 
 * @param {int} time_hour 
 * @param {int} time_minute 
 * @param {int} time_second 
 */
function sendSet(fader_level, send_q_list, qlist_main, qlist_sub, use_time, time_hour, time_minute, time_second) {
  var sysex = setDeviceSysex();

  // command (set = 6)
  sysex[4] = 6;

  // set page and exec if needed
  // it looks like the grandma2 desk is not interpreting default_only
  // see : http://www.ma-share.net/forum/read.php?6,67568,67568#msg-67568
  var offset = 0;
  if (send_q_list || DEVICE_MODEL == "grandma2") {
    offset = 2;
    sysex[5] = qlist_sub - QLIST_SEND_OFFSET;
    sysex[6] = qlist_main;
  }

  // set the fader value
  var coarse_fine = faderLevelToCoarseFine(fader_level);
  sysex[5+ offset] = coarse_fine[1];
  sysex[6+ offset] = coarse_fine[0];

  // add time if needed
  if (use_time) {
    // add time
    sysex[sysex.length] = time_hour;
    sysex[sysex.length] = time_minute;
    sysex[sysex.length] = time_second;
    // add frames
    sysex[sysex.length] = 0;
    // add fractions
    sysex[sysex.length] = 0;
  }

  sendCommand(sysex);
}

/**
 * Send a full sysex "Fire" command
 * @param {int} macro_id 
 */
function sendFire(macro_id) {
  var sysex = setDeviceSysex();

  // command (fire = 7)
  sysex[4] = 7;

  // macro id
  sysex[5] = macro_id;

  sendCommand(sysex);
}

/**
 * Send a full sysex "Go off" command
 * @param {int} q_main 
 * @param {int} q_sub 
 * @param {int} qlist_main 
 * @param {int} qlist_sub 
 */
function sendGoOff(send_q_number, q_main, q_sub, send_q_list, qlist_main, qlist_sub) {
  var sysex = setDeviceSysex();

  // command (go off = 11)
  // command (reset = 10)
  sysex[4] = 11;

  // set Q number if needed
  if (send_q_number) {
    sysex = addQToSysex(sysex, q_main, q_sub);
    // set page and exec if needed
    if (send_q_list) {
      // add the separator
      sysex[sysex.length] = 0;
      // add page and exec
      sysex = addQListToSysex(sysex, qlist_main, qlist_sub);
    }
  }

  sendCommand(sysex);
}

/* **********************
    Chataigne callbacks
  *********************** */

/**
 * Chataigne event triggered when receiving sysex data
 * @param {array} data (sysex data received)
 */
function sysExEvent(data) {
  if (LISTEN != "nothing" && LISTEN != "") autoAdd(data);
}

/**
 * Chataigne method runned when the script is loaded
 */
function init() {
  // Ben told me that it is a bad idea to delete these containers so i will just collapse them first
  local.values.getChild("infos").setCollapsed(true);
  local.values.getChild("tempo").setCollapsed(true);
  local.values.getChild("mtc").setCollapsed(true);
  // fill the enums
  enumAddOptions(local.parameters.deviceParameters.send.commandFormat, msc_command_format, 127);
  enumAddOptions(local.parameters.deviceParameters.receive.commandFormat, msc_command_format, 127);
}

/**
 * Chataigne method runned when a module parameter has changed
 * @param {object} param 
 */
function moduleParameterChanged(param) {
  if (param.isParameter()) {
    // device model
    if (param.name == "deviceModel") {
      if (param.get() == "grandma2") {
        DEVICE_MODEL = "grandma2";
        local.parameters.deviceParameters.send.qListOffset.set(1);
        local.parameters.deviceParameters.receive.qListOffset.set(1);
      }
      else {
        DEVICE_MODEL = "standard";
        local.parameters.deviceParameters.send.qListOffset.set(0);
        local.parameters.deviceParameters.receive.qListOffset.set(0);
      }
    }
    // Q list offset
    if (param.name == "qListOffset") {
      if (sendOrReceive(param.getControlAddress()) == "send") {
        QLIST_SEND_OFFSET = param.get();
      }
      else {
        QLIST_RECEIVE_OFFSET = param.get();
      }
    }
    // Q list separator
    if (param.name == "qListSeparator") {
      if (sendOrReceive(param.getControlAddress()) == "send") {
        QLIST_SEND_SEPARATOR = param.get();
      }
      else {
        QLIST_RECEIVE_SEPARATOR = param.get();
      }
    }
    // listen
    if (param.name == "listen") {
      LISTEN = param.get();
    }
  }
}