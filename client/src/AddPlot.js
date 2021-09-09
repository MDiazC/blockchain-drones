import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import { Link } from 'react-router-dom';
import PlotToken from "./contracts/PlotToken.json";

import "./App.css";

class AddPlot extends Component {
  state = { max_height: '', min_height: '', pesticide: '', message_error: '', events_active: false,
            show_error: false, allowed_pesticides: ['A', 'B', 'C', 'D', 'E'], web3: {}, DroniGateProxyInstance: {},
            proxy_contract_account: '0x0', plotTokenInstance: {}, logged_account: '0x0', plot_token_contract_account: '0x0',
            plot_manager_contract_account: '0x0',dronigate_token_contract_account: '0x0'};

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
      this.state.plot_token_contract_account = this.props.location.state.plot_token_contract_account;
      this.state.plot_manager_contract_account = this.props.location.state.plot_manager_contract_account;
      this.state.dronigate_token_contract_account = this.props.location.state.dronigate_token_contract_account;
    }

  componentDidMount = async () => {
    try {

        if(typeof this.state.email === 'undefined' || this.state.email !== "plot@gmail.com" ){
          this.props.history.push({  pathname: '/', state: {show_error: true}});
        }

        const [web3, events_active]  = await getWeb3();
        this.setState({ web3: web3});
        this.setState({ events_active: events_active});

        var DroniGateProxyInstance = new this.state.web3.eth.Contract(this.state.droniGateProxyAbi, this.state.proxy_contract_account);
        this.setState({ DroniGateProxyInstance: DroniGateProxyInstance });

        var PlotTokenInstance = new this.state.web3.eth.Contract(PlotToken.abi, this.state.plot_token_contract_account);
        this.setState({ PlotTokenInstance: PlotTokenInstance });

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

      if(n === 'pesticide' && (v < 0 || v > 4)){
        if(this.state.allowed_pesticides.indexOf(v) === -1){
          this.setState({show_error : true });
          this.setState({message_error : "Incorrect pesticide selected" });
          return;
        }
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

      if(this.state.pesticide < 0 || this.state.pesticide > 4){
        this.setState({show_error : true });
        this.setState({message_error : "Incorrect pesticide selected" });
        return;
      }

      if(this.state.min_height >= this.state.max_height){
        this.setState({show_error : true });
        this.setState({message_error : "Max and Min height are incorrect" });
        return;
      }

      var that = this;
      var gasEstimated = await this.state.DroniGateProxyInstance.methods.createPlot(this.state.max_height, this.state.min_height, this.state.pesticide).estimateGas({from: this.state.logged_account, gas: 5000000});
      this.state.DroniGateProxyInstance.methods.createPlot(this.state.max_height, this.state.min_height, this.state.pesticide).send({from: this.state.logged_account, gas:parseInt(gasEstimated)+10000}, function(error, result){
        if(!error){
            if(!that.state.events_active){
              //if we don't have events active we may not know the id of the new created plot
              //so we approve all plots to be manageable by Plot Manager
              that.state.PlotTokenInstance.methods.setApprovalForAll(that.state.plot_manager_contract_account, true).estimateGas({from: that.state.logged_account, gas: 5000000}, function(error, result){
                that.state.PlotTokenInstance.methods.setApprovalForAll(that.state.plot_manager_contract_account, true).send({from: that.state.logged_account, gas:parseInt(result)+10000}, function(error, result){
                  if(!error){
                      that.props.history.push({
                          pathname: '/plot-manager',
                          state: {
                            show_success: true,
                            success_message:"Process completed! Plot should be visible in a few seconds",
                            email: that.state.email,
                            proxy_contract_account: that.state.proxy_contract_account,
                            plot_manager_contract_account: that.state.plot_manager_contract_account,
                            plot_token_contract_account: that.state.plot_token_contract_account,
                            droniGateProxyAbi: that.state.droniGateProxyAbi,
                            dronigate_token_contract_account: that.state.dronigate_token_contract_account,
                            logged_account: that.state.logged_account,
                          }
                      });
                  }else{
                    console.log("Error while approving allowance to main contract to manage the new plot "+JSON.stringify(error));
                  }
                });
              });
            }else{
              that.props.history.push({
                  pathname: '/plot-manager',
                  state: {
                    show_success: true,
                    success_message:"Process completed! Plot should be visible in a few seconds",
                    email: that.state.email,
                    proxy_contract_account: that.state.proxy_contract_account,
                    plot_manager_contract_account: that.state.plot_manager_contract_account,
                    plot_token_contract_account: that.state.plot_token_contract_account,
                    droniGateProxyAbi: that.state.droniGateProxyAbi,
                    dronigate_token_contract_account: that.state.dronigate_token_contract_account,
                    logged_account: that.state.logged_account,
                  }
              });
            }
        }else{
          console.log("Error while creating a plot "+JSON.stringify(error));
        }
      });
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
          </div>
        : null }
        <div id="form_container">
          <h1>
            <div className="back">
              <Link to={{ pathname: '/plot-manager',
                          state: {
                            email: this.state.email,
                            proxy_contract_account: this.state.proxy_contract_account,
                            plot_manager_contract_account: this.state.plot_manager_contract_account,
                            plot_token_contract_account: this.state.plot_token_contract_account,
                            droniGateProxyAbi: this.state.droniGateProxyAbi,
                            logged_account: this.state.logged_account,
                          }
                        }}>Back</Link>
            </div>
            <div className="signout">
              <Link to={{ pathname: '/',
                          state: {
                            email: this.state.email,
                            proxy_contract_account: this.state.proxy_contract_account,
                            plot_manager_contract_account: this.state.plot_manager_contract_account,
                            plot_token_contract_account: this.state.plot_token_contract_account,
                            droniGateProxyAbi: this.state.droniGateProxyAbi,
                            logged_account: this.state.logged_account,
                          } }}>Sign out</Link>
            </div>
          </h1>
          <form onSubmit={this.onSubmit} className="appnitro">
            <div className="form_description">
              <h2>Add a new Plot</h2>
              <p></p>
            </div>
            <div id="li_1">
              <label className="description" htmlFor="max_height">Max fumigation height</label>
              <div>
                <input id="element_1" name="max_height" className="element text medium" type="number" placeholder="Type plot's max height" onChange={this.handleChange} value={this.state.max_height}/>
              </div>
            </div>
            <div id="li_2">
              <label className="description" htmlFor="min_height">Min fumigation height</label>
              <div>
                <input id="element_2" name="min_height" className="element text medium" type="number" placeholder="Type plot's min height" onChange={this.handleChange} value={this.state.min_height}/>
              </div>
            </div>
            <div id="li_3">
              <label className="description" htmlFor="pesticide">Allowed pesticide</label>
              <select  onChange={this.handleChange} name="pesticide">
                {pesticides}
              </select>
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

export default AddPlot;
