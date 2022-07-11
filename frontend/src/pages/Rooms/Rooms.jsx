import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import AddRoomModal from '../../components/AddRoomModal/AddRoomModal';
import RoomCard from '../../components/RoomCard/RoomCard';
import { getAllRooms } from '../../http';
import styles from './Rooms.module.css';

// const rooms = [
//     {
//         id: 1,
//         topic: 'This is topic one of room',
//         speakers: [
//             {
//                 id: 1,
//                 name: 'JD',
//                 avatar: '/images/monkey-avatar.png',
//             },
//             {
//                 id: 2,
//                 name: 'MSD',
//                 avatar: '/images/monkey-avatar.png',
//             },
//         ],
//         totalPeople: 50
//     },
//     {
//         id: 2,
//         topic: 'This is topic two of room',
//         speakers: [
//             {
//                 id: 1,
//                 name: 'JD',
//                 avatar: '/images/monkey-avatar.png',
//             },
//             {
//                 id: 2,
//                 name: 'MSD',
//                 avatar: '/images/monkey-avatar.png',
//             },
//         ],
//         totalPeople: 50
//     },
//     {
//         id: 3,
//         topic: 'This is topic three of room',
//         speakers: [
//             {
//                 id: 1,
//                 name: 'JD',
//                 avatar: '/images/monkey-avatar.png',
//             },
//             {
//                 id: 2,
//                 name: 'MSD',
//                 avatar: '/images/monkey-avatar.png',
//             },
//         ],
//         totalPeople: 50
//     },
//     {
//         id: 4,
//         topic: 'This is topic four of room',
//         speakers: [
//             {
//                 id: 1,
//                 name: 'JD',
//                 avatar: '/images/monkey-avatar.png',
//             },
//             {
//                 id: 2,
//                 name: 'MSD',
//                 avatar: '/images/monkey-avatar.png',
//             },
//         ],
//         totalPeople: 50
//     },
// ]

const Rooms = () => {
    const [showModal, setShowModal] = useState(false);
    const [rooms, setRooms] = useState([]);


    useEffect(() => {
        const fetchRooms = async () => {
            const { data } = await getAllRooms();
            setRooms(data);
            console.log(data);
        }
        fetchRooms();
    }, [])
    

    function openModal() {
        setShowModal(true);
    }

    return (
        <>
            <div className="container">
                <div className={styles.roomsHeader}>
                    <div className={styles.left}>
                        <span className={styles.heading}> All voice rooms</span>
                        <div className={styles.searchBox}>
                            <img src="/images/search-icon.png" alt="" />
                            <input type="text" className={styles.searchInput} name="" id="" />
                        </div>
                    </div>
                    <div className={styles.right}>
                        <button onClick={openModal} className={styles.startRoomButton}>
                            <img src="images/add-room-icon.png" alt="add-room" />
                            <span> Start a room </span>
                        </button>
                    </div>
                </div>
                <div className={styles.roomList}>
                    {
                        rooms.map( (room) => (
                            <RoomCard key={room.id} room={room}/>
                        ))  
                    }
                </div>
            </div>
            {showModal && <AddRoomModal onClose={() => setShowModal(false)}/>}
        </>
    )
}

export default Rooms
