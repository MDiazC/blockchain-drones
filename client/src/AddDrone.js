import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import { Link } from 'react-router-dom';

import "./App.css";

class AddDrone extends Component {
  state = { max_height: '', min_height: '', cost: '', pesticide: '',events_active: false,
            message_error: 'Incorrect credentials', show_error: false, allowed_pesticides: ['A', 'B', 'C', 'D', 'E'],
            web3: {}, DroniGateProxyInstance: {}, proxy_contract_account: "0x0", droniGateProxyAbi: ''};

  constructor(props) {
    super();

      this.props = props;
      if(typeof this.props === 'undefined' || typeof this.props.location === 'undefined' || typeof this.props.location.state === 'undefined' || typeof this.props.location.state.email === 'undefined'){
        this.props.history.push({  pathname: '/', state: {show_error: true}});
      }

      this.state.email= this.props.location.state.email;
      this.state.proxy_contract_account = this.props.location.state.proxy_contract_account;
      this.state.droniGateProxyAbi = this.props.location.state.droniGateProxyAbi;
      this.state.logged_account = this.props.location.state.logged_account;
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


    } catch (error) {
    // Catch any errors for any of the above operations.
    alert(
      `Failed to load web3, accounts, or contract. Check console for details.`,
    );
    console.error(error);
    }
  };


    handleChange = (event) => {
      let n = event.target.name;
      let v = event.target.value;
      this.setState({show_error : false });

      if((n === 'max_height' || n === 'min_height') && v < 1){
        this.setState({show_error : true });
        this.setState({message_error : "Height has to be bigger than 0" });
        return;
      }

      if(n === 'pesticide'){
        if(v < 0 || v > 4){
          this.setState({show_error : true });
          this.setState({message_error : "Incorrect pesticide selected" });
          return;
        }
      }

      if(n === 'cost' && v < 1){
        this.setState({show_error : true });
        this.setState({message_error : "Cost incorrect. It has to be biger than zero" });
        return;
      }

      this.setState({
          [n]: parseInt(v)
      })
    }

    onSubmit = async (event) => {
      event.preventDefault();

      if(this.state.max_height < 1 || this.state.max_height === 'undefined'){
        this.setState({show_error : true });
        this.setState({message_error : "Max height has to be bigger than 0" });
        return;
      }

      if(this.state.min_height < 1 || this.state.min_height === 'undefined'){
        this.setState({show_error : true });
        this.setState({message_error : "Min height has to be bigger than 0" });
        return;
      }

      if(this.state.cost < 1 || this.state.cost === 'undefined'){
        this.setState({show_error : true });
        this.setState({message_error : "Cost incorrect. It has to be biger than zero" });
        return;
      }

      if(this.state.pesticide < 0 || this.state.pesticide > 4){
        this.setState({show_error : true });
        this.setState({message_error : "Incorrect pesticide selected"  });
        return;
      }

      if(this.state.min_height >= this.state.max_height){
        this.setState({show_error : true });
        this.setState({message_error : "Max and Min height are incorrect" });
        return;
      }

      var that = this;
      try{
        var gasEstimated = await this.state.DroniGateProxyInstance.methods.createDrone(this.state.max_height, this.state.min_height, this.state.pesticide, this.state.cost ).estimateGas({gas: 5000000});
        this.state.DroniGateProxyInstance.methods.createDrone(this.state.max_height, this.state.min_height, this.state.pesticide, this.state.cost ).send({from: this.state.logged_account, gas:parseInt(gasEstimated)+10000}, function(error, result){
          if(!error){
              that.props.history.push({
                pathname: '/drone-manager',
                state: {
                  show_success: true,
                  success_message:"Process completed! Drone should be visible in a few seconds",
                  email: that.state.email,
                  proxy_contract_account: that.state.proxy_contract_account,
                  droniGateProxyAbi: that.state.droniGateProxyAbi
                }
              });
          }else{
            console.log("Error while creating a drone "+JSON.stringify(error));
          }
        });
      }
      catch(e){
        console.log(e);
      }
    }

    hideAlert = () =>{
      this.setState({ show_success: false, show_error: false});
    }

  render() {

      const pesticides = []

      pesticides.push(<option key="100" value=''>Select Pesticide</option>);
      for (const [index, value] of this.state.allowed_pesticides.entries()) {
        pesticides.push(<option key={index} value={index}>{value}</option>);
      }

    return (
      <div className="App">
        {this.state.show_error ?
          <div id="error_message" >
            <div id="error_message_title">Validation error</div>
            <div id="error_message_desc">{this.state.message_error}.<br />Please try again</div>
            <div id="close" onClick={this.hideAlert}>X</div>
          </div>
        : null }
        <div id="form_container">
          <h1>
            <div className="back">
              <Link to={{ pathname: '/drone-manager',
                          state: {
                            email: this.state.email,
                            proxy_contract_account: this.state.proxy_contract_account,
                            droniGateProxyAbi: this.state.droniGateProxyAbi,
                            logged_account: this.state.logged_account
                          }
                        }}>Back</Link>
            </div>
            <div className="signout">
              <Link to={{ pathname: '/', state:{
                email: this.state.email,
                proxy_contract_account: this.state.proxy_contract_account,
                droniGateProxyAbi: this.state.droniGateProxyAbi,
                logged_account: this.state.logged_account
              } }}>Sign out</Link>
            </div>
          </h1>
          <form onSubmit={this.onSubmit} className="appnitro">
            <div className="form_description">
              <h2>Add a new Drone</h2>
              <p></p>
            </div>
            <div id="li_1">
              <label className="description" htmlFor="max_height">Max fumigation height</label>
              <div>
                <input id="element_1" name="max_height" className="element text medium" type="number" placeholder="Type drone's max height" onChange={this.handleChange} value={this.state.max_height}/>
              </div>
            </div>
            <div id="li_2">
              <label className="description" htmlFor="min_height">Min fumigation height</label>
              <div>
                <input id="element_2" name="min_height" className="element text medium" type="number" placeholder="Type drone's min height" onChange={this.handleChange} value={this.state.min_height}/>
              </div>
            </div>
            <div id="li_3">
              <label className="description" htmlFor="pesticide">Allowed pesticide</label>
              <select onChange={this.handleChange} name="pesticide">
                {pesticides}
              </select>
            </div>
            <div id="li_4">
              <label className="description" htmlFor="cost">Cost</label>
              <div>
                <input id="element_2" name="cost" className="element text medium" type="number" placeholder="Type cost" onChange={this.handleChange} value={this.state.cost}/>
              </div>
            </div>
            <div className="buttons">
              <input id="saveForm" className="button_text" type="submit" name="submit" value="Save" />
            </div>
          </form>
      	</div>
      </div>
    );
  }
}

export default AddDrone;
