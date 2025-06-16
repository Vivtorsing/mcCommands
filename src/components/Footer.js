import { Link } from 'react-router-dom';
import styles from '../styles/footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.copyright}>&copy; {new Date().getFullYear()} Vivtorsing mcCommands. All rights reserved.</p>
    </footer>
  )
}