import { useState } from 'react';
import { useParams } from 'react-router-dom';
import commands from '../data/commands.json';
import blockImages from '../utils/blockImages';
import oneCommand from '../utils/oneCommand';
import styles from '../styles/commandPage.module.css';

export default function CommandPage() {
  const { id } = useParams();
  const cmd = commands.find(c => c.id === id);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showOneCommand, setShowOneCommand] = useState(false);

  if (!cmd) return <p>Command not found.</p>;

  const { blocks } = cmd;

  //make rows for command
  const rowMap = {};
  blocks.forEach((block, i) => {
    const row = block.row || 1;
    if (!rowMap[row]) rowMap[row] = [];
    rowMap[row].push({ ...block, originalIndex: i });
  });

  const sortedRows = Object.keys(rowMap).sort((a, b) => a - b);
  const maxBlocks = Math.max(...Object.values(rowMap).map(row => row.length));
  const blockSize = maxBlocks >= 4 ? 32 : 24;

  return (
    <div className={styles.commandPageContainer}>
      {/*left side*/}
      <div className={styles.commandLeft}>
        <h1 className={styles.commandTitle}>{cmd.name}</h1>
        <p className={styles.commandDesc}>{cmd.description}</p>
        <div className={styles.versionsContainer}>
          <h3 className="font-semibold mb-1">Supported Versions:</h3>
          <div className={styles.versionBadges}>
            {Object.entries(cmd.versions).map(([ver, supported]) => (
              <span
                key={ver}
                className={`${styles.versionBadge} ${
                  supported ? styles.versionSupported : styles.versionUnsupported
                }`}
              >
                {ver}
              </span>
            ))}
          </div>
        </div>

        <h2 className={styles.commandRowTitle}>Commands by Row:</h2>
        {sortedRows.map(rowKey => (
          <div key={rowKey} className={styles.commandRow}>
            <h3 className={styles.commandRowName}>Row {rowKey}</h3>
            {rowMap[rowKey].map((block, i) => {
              const index = block.originalIndex;
              return (
                <div
                  key={index}
                  className={`${styles.commandLine} ${hoveredIndex === index ? styles.highlighted : ''}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => {
                    navigator.clipboard.writeText(`${block.command}`);
                    setCopiedIndex(index);
                    setTimeout(() => setCopiedIndex(null), 1000);
                  }}
                  title='Click to copy command'
                  style={{ cursor: 'pointer' }}
                >
                  {index + 1}.{' '}
                  <span
                    className={`${styles.blockType} ${
                      styles[block.type] || ''
                    }`}
                  >
                    [{block.type}{block.conditional ? ' conditional' : ''}]
                  </span>{' '}
                  {copiedIndex === index ? 'Copied!' : `/${block.command}`}
                </div>
                
              );
            })}
          </div>
        ))}
      </div>

      {/*right side*/}
      <div className={styles.commandRight}>
        {/*preview*/}
        <div className={styles.commandPreviewContainer}>
          <h3 className={styles.previewTitle}>Preview</h3>
          <div className={styles.commandPreviewRows}>
            {sortedRows.map(rowKey => (
              <div key={rowKey} className={styles.commandPreviewColumn}>
                {rowMap[rowKey].map((block, i) => {
                  const index = block.originalIndex;
                  const imgKey = `${block.type}${block.conditional ? 'Conditional' : ''}`;
                  return (
                    <div
                      key={index}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      style={{ textAlign: 'center' }}
                    >
                      <img
                        src={blockImages[imgKey]}
                        alt={block.type}
                        className={`${styles.commandBlockImage} ${
                          hoveredIndex === index ? styles.commandBlockHighlighted : ''
                        }`}
                        style={{ width: blockSize, height: blockSize }}
                      />
                    
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/*video*/}
        <div>
          <h3 className={styles.videoTitle}>Video</h3>
          <div className={styles.videoAspect}>
            <iframe
              className={styles.videoSize}
              src={cmd.video}
              title="Command Video"
              allowFullScreen
            ></iframe>
          </div>
        </div>

        {/*one command*/}
        <div className={styles.oneCommandSection}>
          <p className={styles.lazyText}>Too lazy to copy and paste each command?</p>
          <button
            className={styles.oneCommandButton}
            onClick={() => setShowOneCommand(!showOneCommand)}
          >
            {showOneCommand ? 'Hide One Command' : 'Generate One Command'}
          </button>

          {showOneCommand && (
            <div className={styles.oneCommandBox}>
              <p className={styles.warning}>
                ⚠️ This command will place command blocks facing north. <br />
                ⚠️ Make a backup before using it in your world. <br />
                Please double check each command block to ensure it is correct before running!
              </p>
              <textarea
                className={styles.commandTextarea}
                readOnly
                value={oneCommand(cmd)}
                onClick={(e) => {
                  navigator.clipboard.writeText(e.target.value);
                  setCopiedIndex(-1);
                  setTimeout(() => setCopiedIndex(null), 1000);
                }}
              />
              {copiedIndex === -1 && (
                <p className={styles.copiedMessage}>Copied one command to clipboard!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
