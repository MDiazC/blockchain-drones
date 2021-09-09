import React, { Component } from "react";
import { Link } from 'react-router-dom';
import getWeb3 from "./getWeb3";

import "./App.css";

class DroneManager extends Component {
  state = { drones: null, email: null, show_success: false, success_message: '', show_error: false,
            error_message: '', web3: {}, DroniGateProxyInstance: {}, proxy_contract_account: "0x0",
            droniGateProxyAbi: {}, whitelisted_address: '', events_active: false, logged_account: '0x0'};

  constructor(props) {
    super();

    this.props = props;
    if(typeof this.props === 'undefined' || typeof this.props.location === 'undefined' || typeof this.props.location.state === 'undefined' || typeof this.props.location.state.email === 'undefined'){
      this.props.history.push({  pathname: '/', state: {show_error: true}});
    }else{
      this.state.email= this.props.location.state.email;

      if(typeof this.props.location.state.show_success !== 'undefined' && this.props.location.state.show_success !== false){
        this.state.show_success= this.props.location.state.show_success;
        this.state.success_message= this.props.location.state.success_message;
      }

      if(typeof this.props.location.state.show_error !== 'undefined' && this.props.location.state.show_error !== false){
        this.state.show_error= this.props.location.state.show_error;
        this.state.error_message= this.props.location.state.error_message;
      }

      this.state.proxy_contract_account = this.props.location.state.proxy_contract_account;
      this.state.droniGateProxyAbi = this.props.location.state.droniGateProxyAbi;
    }
  }

  componentDidMount = async () => {
    try {
        if(typeof this.state.email === 'undefined' || this.state.email !== "admin@dronigate.io" ){
          this.props.history.push({  pathname: '/', state: {show_error: true}});
        }

        const [web3, events_active]  = await getWeb3();
        this.setState({ web3: web3});
        this.setState({ events_active: events_active});

        var DroniGateProxyInstance = new this.state.web3.eth.Contract(this.state.droniGateProxyAbi, this.state.proxy_contract_account);
        this.setState({ DroniGateProxyInstance: DroniGateProxyInstance });

        if(this.state.logged_account === '0x0'){
          var account = await this.state.web3.eth.getAccounts();
          this.setState({ logged_account: account[0] });
        }

        this.showDrones();
        if(this.state.events_active){
          this.attachEvents();
        }

      } catch (error) {
    // Catch any errors for any of the above operations.
    alert(
      `Failed to load web3, accounts, or contract. Check console for details.`,
    );
    console.error(error);
    }
  };

  attachEvents = () => {
    var that = this;
    this.state.DroniGateProxyInstance.events.DroneRemoved({}, function(error, event){
       if (error) {
         alert("It was an error removing a drone");
         console.log("Drone remove error "+JSON.stringify(error));
       }else{
         that.setState({ success_message: "Drone removed." , show_success: true});
         that.showDrones();
       }
     })

     this.state.DroniGateProxyInstance.events.DroneCreated({}, function(error, event){
        if (error) {
          alert("It was an error creating a drone");
          console.log("Drone created error "+JSON.stringify(error));
        }else{
          that.showDrones();
        }
      })

      this.state.DroniGateProxyInstance.events.DroneBooked({}, function(error, event){
         if (error) {
           alert("It was an error booking a drone");
           console.log("Drone booked error "+JSON.stringify(error));
         }else{
           that.setState({ success_message: "Drone id "+event.returnValues._droneId+" booked by account "+event.returnValues.addr+"." , show_success: true});
           that.showDrones();
         }
       })

       this.state.DroniGateProxyInstance.events.DroneBlocked({}, function(error, event){
          if (error) {
            alert("It was an error blocking the drone");
            console.log("Drone block error "+JSON.stringify(error));
          }else{
            that.setState({ success_message: "Drone id "+event.returnValues._droneId+" blocked by account "+event.returnValues.addr+"." , show_success: true});
            that.showDrones();
          }
        })
  }

  removeDrone = async (drone_id) => {
    var that = this;
    var account = await this.state.web3.eth.getAccounts();
    var gasEstimated = await this.state.DroniGateProxyInstance.methods.destroyDrone(drone_id).estimateGas({gas: 5000000});
    this.state.DroniGateProxyInstance.methods.destroyDrone(drone_id).send({from: account[0], gas:parseInt(gasEstimated)+10000}, function(error, result){
      if(error){
        that.setState({ error_message: "It was an error while removing a drone." , show_error: true});
      }
    });
  }

  showDrones = async () => {

      var that = this;
      this.state.DroniGateProxyInstance.methods.getAllDrones().call( function(error, result){

        if(error){
          console.log("Error while showing drones "+JSON.stringify(error));
          that.props.history.push({  pathname: '/', state: {show_error: true}});
        }else{
          var _drones = [];
          var ids = result[0];
          var status = result[1];
          var html;

          if(ids.length === 0){
            html = <tr key={0}>
                        <td><h2>No Drones in Database</h2></td>
                      </tr>
            _drones.push(html);
          }else{

            if(ids.length === status.length){
              var i;
              var stat;
              for (i=0; i< ids.length; i++) {
                stat = (status[i])?'Available':'Busy';
                html= <tr key={ids[i]}>
                            <td>Drone id: {ids[i]}</td>
                            <td className="short"><div className={stat.toLowerCase()}>{stat}</div></td>
                            <td className="short"><button value={ids[i]} onClick={e => that.removeDrone(e.target.value)}>Remove</button></td>
                          </tr>;
                _drones.push(html);
              }
            }
          }
          that.setState({ drones: _drones });
        }
      });
  }

  addDrone = (event) => {
    event.preventDefault();

    this.props.history.push({
      pathname: '/drone-manager/add-drone',
      state: {
        email: this.state.email,
        proxy_contract_account: this.state.proxy_contract_account,
        droniGateProxyAbi: this.state.droniGateProxyAbi,
        logged_account: this.state.logged_account
      }
    });
  }

  handleChange = (event) => {
    let n = event.target.name;
    let v = event.target.value;
    this.setState({
        [n]: v
    })
    this.setState({show_error : false });
  }

  onSubmit = async (event) => {
    event.preventDefault();

    if(this.state.whitelisted_address !== ''){
      var account = await this.state.web3.eth.getAccounts();
      var that = this;
      this.state.DroniGateProxyInstance.methods.whitelistAddress(this.state.whitelisted_address).send({from: account[0]}, function(error, result){
        if(error){
            that.setState({ error_message: "It was an error while whitlistng an address." , show_error: true});
        }else{
          that.setState({whitelisted_address : '', success_message:'Address whitelisted', show_success: true });
        }
      });
    }
  }

  hideAlert = () =>{
    this.setState({ show_success: false, show_error: false});
  }

  render() {
    return (
      <div className="App">
        {this.state.show_error ?
          <div id="error_message" >
            <div id="error_message_title">Process error</div>
            <div id="error_message_desc">{this.state.error_message}.<br />Please try again</div>
            <div id="close" onClick={this.hideAlert}>X</div>
          </div>
        : null }
        {this.state.show_success ?
          <div id="success_message" >
            <div id="success_message_title">Drone Manager</div>
            <div id="success_message_desc">{this.state.success_message}</div>
            <div id="close" onClick={this.hideAlert}>X</div>
          </div>
        : null }
        <div id="form_container">
          <h1>
            <div>
              <Link to={{ pathname: '/', state:{
                email:this.state.email,
                proxy_contract_account: this.state.proxy_contract_account,
                droniGateProxyAbi: this.state.droniGateProxyAbi
              } }}>Sign out</Link>
            </div>
          </h1>
          <div className="appnitro">
    					<div className="form_description">
          			<h2>Drone control panel</h2>
          			<p></p>
          		</div>
              <div id="li_1">
                <h4>Drones status</h4>
                <div>
                  <table>
                    <tbody>
                      {this.state.drones}
                    </tbody>
                  </table>
                </div>
              </div>
              <hr />
              <div className="buttons">
                <button onClick={this.addDrone}>Add Drone</button>
              </div>
              <div className="buttons">
                <form onSubmit={this.onSubmit} className="appnitro">
                  <div className="buttons">
                    <label className="description" htmlFor="tokens">Whitelist address</label>
                    <input id="element_2" className="element text small" type="tokens" name="whitelisted_address" placeholder="Address to be whitelisted" onChange={this.handleChange} value={this.state.whitelisted_address}/>
                    <input id="saveForm" className="button_text" type="submit" name="submit" value="Whitelist address" style={{marginLeft: "30px"}}/>
                  </div>
                </form>
              </div>
            </div>
        	</div>
      </div>
    );
  }
}

export default DroneManager;
