import { useState } from 'react';
import { Link } from 'react-router-dom';
import commands from '../data/commands.json';
import styles from '../styles/home.module.css';
import logo from '../assets/logo.png';

export default function Home() {
  const [search, setSearch] = useState('');

  //filter if search
  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  //show only 3o commands
  const maxVisible = 30;
  const visibleCommands = filteredCommands.slice(0, maxVisible);

  return (
    <div className={styles.homePage}>
      {/*title and logo*/}
      <div className={styles.header}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <h1 className={styles.title}>mcCommands</h1>
        <p className={styles.description}>Browse and explore useful Minecraft commands with videos from Vivtorsing!</p>
      </div>

      {/*search*/}
      <input
        type="text"
        placeholder="Search for commands..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={styles.searchBar}
      />

      {/*command cards*/}
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
          <p className={styles.tooManyResults}>Showing first {maxVisible} results. Please refine your search.</p>
        )}
      </div>
    </div>
  );
}
