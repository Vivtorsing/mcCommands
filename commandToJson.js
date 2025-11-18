function convertNotesToCommandBlocks(notes) {
  const lines = notes.split(/\r?\n/);
  const result = [];
  let row = 0;
  let needsNewRow = true;
  let current_command = '';
  let current_type = 'chain';
  let current_conditional = false;

  for(let rawLine of lines) {
    const trimmedLine = rawLine.trim();

    //blank is gap and ignore else put it
    if(trimmedLine === '') {
      if(current_command !== '') {
        result.push({
          type: current_type,
          row: row,
          command: current_command,
          ...(current_conditional ? { conditional: true } : {})
        });
        current_command = '';
        current_type = 'chain';
        current_conditional = false;
      }
      needsNewRow = true;
      continue;
    }

    //get the command type
    const colonIndex = rawLine.indexOf(':');
    const hasColon = colonIndex !== -1;

    //check if new block
    if(hasColon || current_command === '') {
      //clean it up
      if(current_command !== '') {
        result.push({
          type: current_type,
          row: row,
          command: current_command,
          ...(current_conditional ? { conditional: true } : {})
        });
        current_command = '';
        current_type = 'chain';
        current_conditional = false;
      }

      //make new block
      const prefix = hasColon ? rawLine.substring(0, colonIndex).trim().toLowerCase() : '';
      const commandPart = hasColon ? rawLine.substring(colonIndex + 1).trimStart() : rawLine.trim();

      current_command = commandPart;

      //find the type
      if(prefix === '' || prefix === 'impulse') {
        current_type = 'impulse';
      } else if(prefix === 'repeat') {
        current_type = 'repeat';
      } else if(prefix.includes('conditional')) {
        current_type = 'chain';
        current_conditional = true;
      } else {
        current_type = 'chain';
        current_conditional = false;
      }

      //increase row
      if(needsNewRow || current_type !== 'chain') {
        row++;
      }
      needsNewRow = false;
    } else {
      current_command += '\\n' + rawLine.trimStart();
    }
  }

  //add the last one
  if(current_command !== '') {
    result.push({
      type: current_type,
      row: row,
      command: current_command,
      ...(current_conditional ? { conditional: true } : {})
    });
  }

  return result;
}

let notes = `
impulse: scoreboard objectives add timer dummy

impulse: give @p minecraft:vex_spawn_egg[minecraft:entity_data={id:"minecraft:vex",Tags:["mosq"],attributes:[{id:"minecraft:scale",base:0}],Silent:1b,life_ticks:1200,active_effects:[{id:"minecraft:invisibility",amplifiler:1,duration:-1,show_particles:0b}]}]

repeat: execute as @e[tag=mosq] at @s unless entity @e[tag=mosqBlock,distance=..0.25] run summon minecraft:block_display ~-.03 ~ ~-.03 {Tags:["mosqBlock"],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.0625f,0.0625f,0.0625f]},block_state:{Name:"minecraft:gray_concrete"}}
chain: execute as @e[tag=mosqBlock] at @s unless entity @e[tag=mosq,distance=..0.25] run kill @s
chain: execute as @e[tag=mosq] at @s if entity @e[type=minecraft:player,distance=..2] run playsound minecraft:entity.bee.loop_aggressive ambient @a ~ ~ ~ .5 2

repeat: execute as @a at @s if biome ~ ~ ~ minecraft:plains run scoreboard players add @s timer 1
chain: execute as @a at @s if score @s timer matches 20 run execute store result score @s timer run random value 21..25
chain: execute as @a at @s if score @s timer matches 21 run summon vex ~ ~5 ~ {Tags:["mosq"],attributes:[{id:"minecraft:scale",base:0}],Silent:1b,life_ticks:1200,active_effects:[{id:"minecraft:invisibility",amplifiler:1,duration:-1,show_particles:0b}]}
chain: execute as @a at @s if score @s timer matches 20.. run scoreboard players set @s timer 0
`;

const blocks = convertNotesToCommandBlocks(notes);
console.log(JSON.stringify(blocks, null, 2));

//NOTES
//if you have \n you have to clean those manually and it should work...
//everything else looks fine I hope
//also impulse need impulse in the start