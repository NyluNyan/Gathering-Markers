const fs = require('fs'),
path = require('path');

module.exports = function GatheringMarkers(mod) {
	
    const config = require('./config.json');
	
    let Markers = [],
	scan = false,
	hooks = [];
	
	mod.command.add('gt', (cmd, arg1, arg2)=> {
		var length = config.marklist.length;
		switch (cmd)
		{
			default:
				if(cmd !== 'all')
				{
					if(arg1) cmd = (cmd + ' ' + arg1);
					for(var i = 0; i < config.nodes.length; i++)
					{
						if(config.nodes[i][0] !== undefined && config.nodes[i].includes(cmd))
						{
							if(!config.marklist.includes(config.nodes[i][0]))
							{
								config.marklist.push(config.nodes[i][0], config.nodes[i+1]);
								mod.command.message('added ' + config.nodes[i][0] + ' to marking list');
								i += 1000; length++;
							}
							else mod.command.message(cmd + ' already in marking list');
						}
					}
					if(config.marklist.length === length) mod.command.message('node not found in gathering list');
				}
				else
				{
					config.marklist = [];
					for(var i = 0; i < config.nodes.length; i+=2) config.marklist.push(config.nodes[i][0], config.nodes[i+1]);
					mod.command.message('added all nodes to marking list');
				}
				break;
			case undefined:
				if(hooks[0] === undefined)
				{
					hooks.push(mod.hook('S_SPAWN_COLLECTION', 4, (event) => {
						if(config.marklist.includes(event.id))
						{
							var mark = event.gameId*2n;
							if(!Markers.includes(mark)) SpawnMarker(mark, event.loc);
						}
						else if(scan) mod.command.message(event.id);
						else if(!config.nodes.includes(event.id)) return false;
					}));
					
					hooks.push(mod.hook('S_DESPAWN_COLLECTION', 2, (event) => {
						var mark = event.gameId*2n;
						if(Markers.includes(mark)) ClearMarker(mark);
					}));
					mod.command.message('gathering markers enabled');
				}
				else
				{
					mod.unhook(hooks[0]);
					mod.unhook(hooks[1]);
					hooks = [];
					var x = Markers.length;
					for(var i = 0; i < x; i++) ClearMarker(Markers[0]);
					mod.command.message('gathering markers disabled');
				}
				break;
			case 'rem':
				if(arg1 !== 'all')
				{
					if(arg2) arg1 = (arg1 + ' ' + arg2);
					for(var i = 0; i < length; i++)
					{
						if(isNaN(config.marklist[i]) && config.marklist[i].includes(arg1))
						{
							mod.command.message(config.marklist[i] + ' removed from marking list');
							config.marklist.splice(i, 2);
							i += 1000;
						}
					}
					if(config.marklist.length === length) mod.command.message('node not found in marking list');
				}
				else
				{
					config.marklist = [];
					mod.command.message('cleared all nodes from marking list');
				}
				break;
			case 'help':
				mod.command.message('\n"gt" enable/disable marking\n"gt apple" search for apple trees\n"gt rem apple" stop searching for apple trees\n"gt all/rem all" add/remove all nodes from searching list\n"gt list" list nodes being searched for');
				break;
			case 'list':
				var list = [];
				for(var i = 0; i < config.marklist.length; i++) if(isNaN(config.marklist[i])) list.push((' ' + config.marklist[i]));
				if(list.length) mod.command.message(list);
				else mod.command.message('the marking list is empty');
				break;
			case 'scan':
				scan = !scan;
				mod.command.message('gathering node scanning ' + (scan ? 'en' : 'dis') + 'abled');
				break;
		}
		if(config.marklist.length !== length)
		{
			fs.writeFile(path.join(__dirname, 'config.json'), (JSON.stringify(config, null, 2)), err => {
				if(err) return;
			});
		}
    });
	
	mod.game.on('enter_loading_screen', () => {
		var length = Markers.length;
		if(length) for(var i = 0; i < length; i++) ClearMarker(Markers[0]);
    });
	
	function SpawnMarker(id, loc) 
	{
		Markers.push(id);
        loc.z -= 100;
		mod.toClient('S_SPAWN_DROPITEM', 8, {
		gameId: id,
		loc: loc,
		item: 98260,
		amount: 1,
		expiry: 999999,
		owners: [{playerId: 0n}]
		});
	}
	
	function ClearMarker(id) 
	{
		mod.toClient('S_DESPAWN_DROPITEM', 4, {
			gameId: id
		});
		Markers.splice(Markers.indexOf(id), 1);
	}
}