import { useState } from 'react';
import { Link } from 'react-router-dom';
import commands from '../data/commands.json';
import miniCommands from '../data/miniCommands.json';
import styles from '../styles/home.module.css';
import logo from '../assets/logo.png';

export default function Home() {
  const [search, setSearch] = useState('');

  //filter big commands
  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  //filter mini commands
  const filteredMini = miniCommands.filter(mc =>
    mc.name.toLowerCase().includes(search.toLowerCase()) ||
    mc.description.toLowerCase().includes(search.toLowerCase())
  );

  const maxVisible = 30;
  const visibleCommands = filteredCommands.slice(0, maxVisible);
  const visibleMini = filteredMini.slice(0, maxVisible);

  return (
    <div className={styles.homePage}>
      {/*title and logo*/}
      <div className={styles.header}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <h1 className={styles.title}>mcCommands</h1>
        <p className={styles.description}>
          Browse and explore useful Minecraft commands with videos from Vivtorsing!
        </p>
      </div>

      {/*search*/}
      <input
        type="text"
        placeholder="Search for commands..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={styles.searchBar}
      />

      {/*big commands*/}
      <h2 className={styles.sectionTitle}>Commands</h2>
      <div className={styles.commandGrid}>
        {visibleCommands.map(cmd => (
          <Link to={`/command/${cmd.id}`} key={cmd.id} className={styles.commandCard}>
            <h2 className={styles.cardTitle}>{cmd.name}</h2>
            <p className={styles.cardDescription}>{cmd.description}</p>
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
          </Link>
        ))}
        {filteredCommands.length > maxVisible && (
          <p className={styles.tooManyResults}>
            Showing first {maxVisible} results. Please refine your search.
          </p>
        )}
        {filteredCommands.length == 0 && (
          <p className={styles.tooManyResults}>
            No Results...
          </p>
        )}
      </div>

      {/*mini commands*/}
      <h2 className={styles.sectionTitle}>Mini Commands</h2>
      <div className={styles.commandGrid}>
        {visibleMini.map(mc => (
          <Link to={`/mini/${mc.id}`} key={mc.id} className={styles.commandCard}>
            <h2 className={styles.cardTitle}>{mc.name}</h2>
            <p className={styles.cardDescription}>{mc.description}</p>
            <div className={styles.versionBadges}>
              {Object.entries(mc.versions).map(([ver, supported]) => (
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
          </Link>
        ))}
        {filteredMini.length > maxVisible && (
          <p className={styles.tooManyResults}>
            Showing first {maxVisible} results. Please refine your search.
          </p>
        )}
        {filteredMini.length == 0 && (
          <p className={styles.tooManyResults}>
            No Results...
          </p>
        )}
      </div>
    </div>
  );
}