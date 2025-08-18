import React, { Component } from "react";

import Tooltip from "../tooltip";

import BlockImage from "./blockImage";

import "./materials.css";

class Materials extends Component {
  state = { onlyMaxPerSplit: false };

  onOnlyMaxPerSplitChange = () => {
    this.setState((currentState) => ({
      // nb this method of passing currentState instead of using this.state... is prefered; TODO neaten up controller uses
      onlyMaxPerSplit: !currentState.onlyMaxPerSplit,
    }));
  };

  getMaterialsCount_nonZeroMaterialsItems() {
    const { coloursJSON, currentMaterialsData } = this.props;
    const { onlyMaxPerSplit } = this.state;
    const materialsCount = {};
    for (const colourSetId of Object.keys(coloursJSON)) {
      materialsCount[colourSetId] = 0;
    }
    for (const row of currentMaterialsData.maps) {
      for (const map of row) {
        for (const [colourSetId, materialCount] of Object.entries(map.materials)) {
          if (onlyMaxPerSplit) {
            materialsCount[colourSetId] = Math.max(materialsCount[colourSetId], materialCount);
          } else {
            materialsCount[colourSetId] += materialCount;
          }
        }
      }
    }
    return Object.entries(materialsCount)
      .filter(([_, value]) => value !== 0)
      .sort((first, second) => {
        return second[1] - first[1];
      });
  }

  getMaterialsCount_supportBlock() {
    const { currentMaterialsData } = this.props;
    const { onlyMaxPerSplit } = this.state;
    let supportBlockCount = 0;
    currentMaterialsData.maps.forEach((row) => {
      row.forEach((map) => {
        const count = map.supportBlockCount;
        if (onlyMaxPerSplit) {
          supportBlockCount = Math.max(supportBlockCount, count);
        } else {
          supportBlockCount += count;
        }
      });
    });
    return supportBlockCount;
  }

  formatMaterialCount = (count) => {
    if (count < 64) return '' + count;

    const numberOfShulkers = Math.floor(count / 1728);
    const numberOfStacks = Math.floor((count % 1728) / 64);
    const remainder = count % 64;

    const sb = numberOfShulkers > 0 ? `${numberOfShulkers} SB` : "";
    const stacks = numberOfStacks > 0 ? `${numberOfStacks} ST` : "";
    const items = remainder > 0 ? `${remainder}`: "";

    const split = [sb, stacks, items].filter(n => n).join(' + ');

    return `${count.toString()} (${split})`;
  };

  colourSetIdAndBlockIdFromNBTName(blockName) {
    const { coloursJSON, optionValue_version } = this.props;
    for (const [colourSetId, colourSet] of Object.entries(coloursJSON)) {
      for (const [blockId, block] of Object.entries(colourSet.blocks)) {
        if (!(optionValue_version.MCVersion in block.validVersions)) {
          continue;
        }
        let blockNBTData = block.validVersions[optionValue_version.MCVersion];
        if (typeof blockNBTData === "string") {
          // this is of the form eg "&1.12.2"
          blockNBTData = block.validVersions[blockNBTData.slice(1)];
        }
        if (
          Object.keys(blockNBTData.NBTArgs).length === 0 && // no exotic blocks for noobline
          blockName.toLowerCase() === blockNBTData.NBTName.toLowerCase()
        ) {
          return { colourSetId, blockId };
        }
      }
    }
    return null; // if block not found
  }

  nbtNameToColourSetId(colourSetId) {
    const { coloursJSON, optionValue_version, currentMaterialsData } = this.props;
    const colourSet = coloursJSON[colourSetId];
    const selection = currentMaterialsData.currentSelectedBlocks[colourSetId];

    if (selection < 0) return null;

    const block = colourSet.blocks[selection];
    if (!(optionValue_version.MCVersion in block.validVersions)) {
      return null;
    }
    let blockNBTData = block.validVersions[optionValue_version.MCVersion];

    if (typeof blockNBTData === "string") {
      // this is of the form eg "&1.12.2"
      blockNBTData = block.validVersions[blockNBTData.slice(1)];
    }

    return blockNBTData.NBTName.toLowerCase();
  }

  copyToClipboard(nonZeroMaterialsItems, supportBlockCount) {
    const { optionValue_supportBlock} = this.props;

    const mergedList = new Array(nonZeroMaterialsItems.length);

    for (const [colourSetId, val] of Object.values(nonZeroMaterialsItems)) {
      const mcId = this.nbtNameToColourSetId(colourSetId);
      mergedList[mcId] = val;
    }

    mergedList[optionValue_supportBlock] += supportBlockCount;

    const counts = Object.fromEntries(
      Object.entries(mergedList.sort((first, second) => second - first))
      .map(([k, v]) => [k, this.formatMaterialCount(v)]));

    const NBSP = String.fromCharCode(160); //non-breaking space
    const CRLF = String.fromCharCode(13, 10); //new line

    const results = ["```"];

    //calculate paddings
    let nameMaxLength = 0;

    for (const key of Object.keys(counts)) {
      if (nameMaxLength < key.length)
        nameMaxLength = key.length;
    }

    //insert each entry
    for (const [key, val] of Object.entries(counts)) {
      results.push(key.padEnd(nameMaxLength, NBSP) + " = " + val);
    }

    results.push("```");

    navigator.clipboard.writeText(results.join(CRLF));
  }

  render() {
    const { getLocaleString, coloursJSON, optionValue_supportBlock, currentMaterialsData, onChangeColourSetBlock } = this.props;
    const { onlyMaxPerSplit } = this.state;
    const nonZeroMaterialsItems = this.getMaterialsCount_nonZeroMaterialsItems();
    const supportBlockCount = this.getMaterialsCount_supportBlock();
    const supportBlockIds = this.colourSetIdAndBlockIdFromNBTName(optionValue_supportBlock);
    return (
      <div className="section materialsDiv">
        <h2>{getLocaleString("MATERIALS/TITLE")}</h2>
        <Tooltip tooltipText={getLocaleString("MATERIALS/SHOW-PER-SPLIT-TT")}>
          <b>
            {getLocaleString("MATERIALS/SHOW-PER-SPLIT")}
            {":"}
          </b>
        </Tooltip>{" "}
        <input type="checkbox" checked={onlyMaxPerSplit} onChange={this.onOnlyMaxPerSplitChange} />
        <br />
        <button type="button" onClick={() => this.copyToClipboard(nonZeroMaterialsItems, supportBlockCount)}>{getLocaleString("MATERIALS/COPY-CLIPBOARD")}</button>
        <table id="materialtable">
          <tbody>
            <tr>
              <th>{getLocaleString("MATERIALS/BLOCK")}</th>
              <th>{getLocaleString("MATERIALS/AMOUNT")}</th>
            </tr>
            {supportBlockCount !== 0 && (
              <tr>
                <th>
                  <Tooltip tooltipText={getLocaleString("MATERIALS/PLACEHOLDER-BLOCK-TT")}>
                    <BlockImage
                      getLocaleString={getLocaleString}
                      coloursJSON={coloursJSON}
                      colourSetId={supportBlockIds === null ? "64" : supportBlockIds.colourSetId}
                      blockId={supportBlockIds === null ? "2" : supportBlockIds.blockId}
                    />
                  </Tooltip>
                </th>
                <th>{this.formatMaterialCount(supportBlockCount)}</th>
              </tr>
            )}
            {nonZeroMaterialsItems.map(([colourSetId, materialCount]) => {
              const blockId = currentMaterialsData.currentSelectedBlocks[colourSetId];
              return (
                <tr key={colourSetId}>
                  <th>
                    <Tooltip tooltipText={coloursJSON[colourSetId].blocks[blockId].displayName}>
                      <BlockImage coloursJSON={coloursJSON} colourSetId={colourSetId} blockId={blockId} />
                    </Tooltip>
                    <Tooltip tooltipText={getLocaleString("NONE")}>
                      <BlockImage
                        getLocaleString={getLocaleString}
                        coloursJSON={coloursJSON}
                        colourSetId={colourSetId}
                        blockId={"-1"}
                        onClick={() => onChangeColourSetBlock(colourSetId, "-1")}
                        style={{
                          cursor: "pointer"
                        }}
                      />
                    </Tooltip>
                  </th>
                  <th>{this.formatMaterialCount(materialCount)}</th>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

export default Materials;
