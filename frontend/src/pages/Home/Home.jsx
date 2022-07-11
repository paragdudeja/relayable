import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button/Button';
import Card from '../../components/shared/Card/Card';
import styles from './Home.module.css'

const Home = () => {
    const signinLinkStyle = {
        color: '#0077ff',
        fontWeight: 'bold',
        textDecoration: 'none',
        marginLeft: '10px'
    }

    const navigate = useNavigate();

    function startRegister() {
        navigate('/authenticate');
        // console.log("Button clicked!");
    }

    return (
        <div className={styles.cardWrapper}>
            <Card title="Welcome to RelayAble!" icon="logo">
                <p className={styles.text}>
                    Enjoy this from home, and connect with your tribe. 
                    On the internet.
                </p>
                <div>
                    <Button onClick={startRegister} text="Let's Go"></Button>
                </div>
                <div className={styles.signinWrapper}>
                    <span className={styles.hasInvite}>Have an invite text?</span>
                    <Link style={signinLinkStyle} to="/login">Sign in</Link>
                </div>
            </Card>
        </div>
        
    );
};

export default Home
