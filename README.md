# Chataigne midi msc
This script is a custom hardware module to use with the software [Chataigne](http://benjamin.kuperberg.fr/chataigne) and the Midi MSC compatible devices.

This script is using midi msc commands.

This module is getting values from the device and can send values to the device to automate some processes.

## How to use this module ?
* Configure the msc in your device
* Copy the module folder in the Chataigne's Documents folder (c:\Users\youruser\Documents\Chataigne\modules) or in a "module" subfolder where your .noisette file is located.
* Assign the midi in and midi out port
* Configure the "Device parameters" to reflect your device ones

### Listen to messages from the device
* In the "Module parameters", select an option in the "Listen" list :
  * None : do not listen anything
  * Listen : just listen the messages and update the existing values without creating new ones
  * AASingle : Auto Add the first value listened from the desk to the "Custom variables" and then set this param to "None"
  * AAAll : Auto Add All the values listened from the desk to the "Custom variables"
* Once your values are captured, you can set "Listen" to "listen" to update the values.

### Send commands to the device
To send commands, you can use one of the integrated callbacks.

### Generate QLists
Generate qlist targets in custom vars groups so also in the module values if not exist.
If you ask to generate 10 qlists, it will create :
10 custom variables groups, each one containing :
fader level
go
stop
resume
go off
Q main
Q sub
and the same inside the module's value container.

### Fill Custom Variables Group
Generate value targets in the same group and the same kind.
if you ask to generate 10 fader levels starting at qlist 1.0 in the group named "as you like", it will create only one custom variables group containing 10 fader levels.
And on the module's value container, they will be created too if not exist but organized in qlist containers.
