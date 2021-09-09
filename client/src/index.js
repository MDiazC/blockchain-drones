import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Route, Switch, BrowserRouter as Router } from 'react-router-dom'
import App from './App';
import DroneManager from './DroneManager';
import PlotManager from './PlotManager';
import AddDrone from './AddDrone';
import AddPlot from './AddPlot';
import * as serviceWorker from './serviceWorker';

const routs = (
  <Router>
   <Switch>
       <Route exact path="/" component={App} />
       <Route exact path="/drone-manager" component={DroneManager} render={(props) => ( <DroneManager {...props} /> )}  />
       <Route exact path="/plot-manager" component={PlotManager} render={(props) => ( <PlotManager {...props} /> )}  />
       <Route exact path="/drone-manager/add-drone" component={AddDrone} render={(props) => ( <AddDrone {...props} /> )}  />
       <Route exact path="/plot-manager/add-plot" component={AddPlot} render={(props) => ( <AddPlot {...props} /> )}  />
   </Switch>
   </Router>
);
ReactDOM.render(routs, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
