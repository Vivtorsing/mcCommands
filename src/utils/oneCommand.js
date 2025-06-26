export default function oneCommand(json) {
  const blockTypeMap = {
    impulse: "command_block",
    repeat: "repeating_command_block",
    chain: "chain_command_block"
  };

  const rows = [...new Set(json.blocks.map(b => b.row))].sort((a, b) => a - b);
  let xOffset = 0;
  const setblockCommands = [];

  for(const row of rows) {
    const blocksInRow = json.blocks
      .filter(b => b.row === row)
      .sort((a, b) => {
        const order = { impulse: 0, repeat: 1, chain: 2 };
        return order[a.type] - order[b.type];
      });

    let zOffset = -3;
    for(const block of blocksInRow) {
      const mcType = blockTypeMap[block.type];
      const conditional = block.conditional ? "[conditional=true]" : "";
      const chain = block.type == 'chain' ? ",auto:1b" : "";

      const escapedCmd = block.command.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`);
      const innerNbt = `Command:"${escapedCmd}"${chain}`;
      const fullCmd = `setblock ~${xOffset} ~-1 ~${zOffset} minecraft:${mcType}${conditional}{${innerNbt}} replace`;

      const escapedFullCmd = fullCmd.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`);
      setblockCommands.push(escapedFullCmd);

      zOffset -= 1;
    }

    xOffset += 2;
  }

  //kill the command block minecarts in the end
  setblockCommands.push('kill @e[type=command_block_minecart,distance=..3]');

  //nest everything
  let nested = null;
  for(let i = setblockCommands.length - 1; i >= 0; i--) {
    const cart = {
      id: "command_block_minecart",
      Command: setblockCommands[i]
    };
    if(nested) cart.Passengers = [nested];
    nested = cart;
  }

  const summonStructure = {
    id: "falling_block",
    BlockState: { Name: "activator_rail" },
    Time: 1,
    Passengers: [nested]
  };

  return `summon falling_block ~ ~1 ~ ${jsonToMcNbt(summonStructure)}`;
}

function jsonToMcNbt(obj) {
  if(Array.isArray(obj)) {
    return `[${obj.map(jsonToMcNbt).join(",")}]`;
  } else if(typeof obj === "object") {
    return `{${Object.entries(obj)
      .map(([k, v]) => `${k}:${jsonToMcNbt(v)}`)
      .join(",")}}`;
  } else if(typeof obj === "string") {
    return `"${obj}"`;
  } else {
    return obj;
  }
}