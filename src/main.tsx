import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {App} from './app/App';
import {ErrorBoundary} from './components/UI';
import './styles.css';
import 'katex/dist/katex.min.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><BrowserRouter><App/></BrowserRouter></ErrorBoundary></React.StrictMode>);
