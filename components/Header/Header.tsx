import React, {useState} from 'react';
import Modal from '../Modal';
import styles from './Header.module.scss';
import { useRouter } from 'next/router';
import logoImg from '../../public/logo.png';
import Image from 'next/image'
import dynamic from 'next/dynamic'
const Button = dynamic(import('react-bootstrap/esm/Button'), {ssr: false})

const Header = ({onLogOut, isLoggedIn} : {onLogOut?: () => void, isLoggedIn?: boolean}) => {
  const router = useRouter();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  console.log(router);

  return (
    <header className={styles.header}>
      <div className={styles.headerTitle} onClick={() => router.push('/')}>
        {/* <Image src={logoImg} /> */}
        <h1>BRING THE GYM ADMIN</h1>
      </div>
      {isLoggedIn && (
        <Button variant="primary" onClick={() => onLogOut && onLogOut()} style={{backgroundColor: 'rgba(208, 217, 222, 0.1)', outline: 'none', border: 'none'}}>Log Out</Button>
      )}
    </header>
  )
}

export default Header
