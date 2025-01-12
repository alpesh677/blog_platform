import express from 'express';
import { BASE_URL, CLIENT_URL, PORT } from './src/config/serverConfig.js';
import connectDB from './src/config/dbConfig.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './src/routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import expressEjsLayouts from 'express-ejs-layouts';
import methodOverride from 'method-override';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

app.use((req, res, next) => {
    console.log(`HTTP Method: ${req.method} | Path: ${req.path}`);
    next();
});

app.use(expressEjsLayouts);
app.set('layout', 'layout/main'); // Set default layout
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

app.use(
    '/dist',
    (req, res, next) => {
        if (req.path.endsWith('.css')) {
            res.type('text/css');
        }
        next();
    },
    express.static(path.join(__dirname, 'dist'))
);

const corsOptions = {
    origin: CLIENT_URL,
    credentials: true,
    optionsSuccessStatus: 200,
};

async function startServer() {
    await connectDB();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(cors(corsOptions));

    app.use((req, res, next) => {
        res.locals.user = req.user; // Assuming you're using some authentication middleware that sets req.user
        next();
    });

    // app.use((req, res, next) => {
    //     res.locals.user = req.user; // Assuming you're using some authentication middleware that sets req.user
    //     if (req.path.startsWith('/api/v1/admin')) {
    //         res.locals.layout = 'admin/layout';
    //     } else {
    //         res.locals.layout = 'layout/main';
    //     }
    //     next();
    // });

    app.get('/', (req, res) => {
        res.render('layout/main', { body: 'home' });
    });
    
    app.use('/api', router);
    app.listen(PORT, () => {
        console.log(`Server running on: ${BASE_URL}`);
    });
}

startServer();
