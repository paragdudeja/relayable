require('dotenv').config()
const express = require('express');
const DbConnect = require('./database');
const app = express();
const router = require('./routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const ACTIONS = require('./actions');

const server = require('http').createServer(app);

const io = require('socket.io')(server, {
    cors: {
        origin: 'https://localhost:3000',
        methods: ['GET', 'POST'],
    },
})

app.use(cookieParser());
const corsOption = {
    credentials: true,
    origin: ['http://localhost:3000'],
};
app.use(cors(corsOption));
app.use( '/storage',express.static('storage'))


const PORT = process.env.PORT || 5500;
DbConnect();
app.use(express.json({limit: '8mb'}));
app.use(router);
app.get('/', (req, res) => {
    res.send('Hello from express js')
})

// Sockets
const socketUserMap = {};

io.on('connection', (socket) => {
    console.log('New connection', socket.id);
    socket.on(ACTIONS.JOIN, ({ roomId, user }) => {
        socketUserMap[socket.id] = user;
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        clients.forEach((clientId) => {
            io.to(clientId).emit(ACTIONS.ADD_PEER, {
                peerId: socket.id,
                createOffer: false,
                user,
            });
            socket.emit(ACTIONS.ADD_PEER, {
                peerId: clientId,
                createOffer: true,
                user: socketUserMap[clientId],
            });
        });
        socket.join(roomId);
    });

    socket.on(ACTIONS.RELAY_ICE, ({ peerId, icecandidate }) => {
        io.to(peerId).emit(ACTIONS.ICE_CANDIDATE, {
            peerId: socket.id,
            icecandidate,
        });
    });

    socket.on(ACTIONS.RELAY_SDP, ({ peerId, sessionDescription }) => {
        io.to(peerId).emit(ACTIONS.SESSION_DESCRIPTION, {
            peerId: socket.id,
            sessionDescription,
        });
    });

    // leave room
    const leaveRoom = () => {
        const { rooms } = socket;
        Array.from(rooms).forEach((roomId) => {
            const clients = Array.from(
                io.sockets.adapter.rooms.get(roomId) || []
            );
            clients.forEach((clientId) => {
                io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
                    peerId: socket.id,
                    userId: socketUserMap[socket.id]?.id,
                });

                socket.emit(ACTIONS.REMOVE_PEER, {
                    peerId: clientId,
                    userId: socketUserMap[clientId]?.id,
                });
            });
            socket.leave(roomId);
        });
        delete socketUserMap[socket.id];
    };

    socket.on(ACTIONS.LEAVE, leaveRoom);

    socket.on('disconnecting', leaveRoom);
});

server.listen(PORT, ()=> console.log(`Listening on port ${PORT}`));