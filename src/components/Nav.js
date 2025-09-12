import { Link } from 'react-router-dom';
import styles from '../styles/nav.module.css';

export default function Nav() {
  return (
    <nav className={styles.navBar}>
      <div className={styles.navLeft}>
        <Link to="/" className={styles.navTitle}>mcCommands</Link>
      </div>
      <div className={styles.navRight}>
        <Link to="/" className={styles.navLink}>Home</Link>
        <Link to="/faq" className={styles.navLink}>FAQ</Link>
      </div>
    </nav>
  );
}
