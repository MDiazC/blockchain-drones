import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import { Link } from 'react-router-dom';
import DroniGateToken from "./contracts/DroniGateToken.json";
import PlotToken from "./contracts/PlotToken.json";

import "./App.css";

class PlotManager extends Component {
  state = { plots: null, email: null, show_success: false, success_message: '', show_error: false,
            error_message: '', fumigation_modal:false, web3: {}, DroniGateProxyInstance: {},
            proxy_contract_account: "0x0", droniGateProxyAbi: {}, selected_tokens: '', available_tokens: 0,
            selected_plot: '', available_drone: '', cost: 0, logged_account: '0x0', dronigate_token_contract_account: '0x0',
            plot_token_contract_account: '0x0', events_active: false, PlotTokenInstance: {},
            plot_manager_contract_account: '0x0'};

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
      this.state.dronigate_token_contract_account = this.props.location.state.dronigate_token_contract_account;
      this.state.plot_token_contract_account = this.props.location.state.plot_token_contract_account;
      this.state.plot_manager_contract_account = this.props.location.state.plot_manager_contract_account;
      this.state.droniGateProxyAbi = this.props.location.state.droniGateProxyAbi;
    }
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

        var DroniGateTokenInstance = new this.state.web3.eth.Contract(DroniGateToken.abi, this.state.dronigate_token_contract_account);
        this.setState({ DroniGateTokenInstance: DroniGateTokenInstance });

        var PlotTokenInstance = new this.state.web3.eth.Contract(PlotToken.abi, this.state.plot_token_contract_account);
        this.setState({ PlotTokenInstance: PlotTokenInstance });

        if(this.state.logged_account === '0x0'){
          var account = await this.state.web3.eth.getAccounts();
          this.setState({ logged_account: account[1] });
        }

        this.showPlots();
        this.updateTokens();
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
    this.state.DroniGateProxyInstance.events.FumigationStarted({}, function(error, event){
       if (error) {
         alert("Fumigation didn't start");
         console.log("Fumigation started error "+JSON.stringify(error));
       }else{
         if(event.returnValues.addr === that.state.logged_account){
           that.showPlots();
           that.updateTokens();
         }
       }
     })

     this.state.DroniGateProxyInstance.events.PlotCreated({}, function(error, event){
        if (error) {
          alert("It was an error while creating a plot");
          console.log("Plot created error "+JSON.stringify(error));
        }else{
          if(event.returnValues._owner === that.state.logged_account){
            var plotId = event.returnValues._plotId;
            that.state.PlotTokenInstance.methods.approve(that.state.plot_manager_contract_account, plotId).estimateGas({from: that.state.logged_account, gas: 5000000}, function(error, result){
              that.state.PlotTokenInstance.methods.approve(that.state.plot_manager_contract_account, plotId).send({from: that.state.logged_account, gas:parseInt(result)+10000}, function(error, result){
                if(!error){
                    that.showPlots();
                }else{
                  console.log("Error while approving allowance to main contract to manage the new plot "+JSON.stringify(error));
                }
              });
            });
          }
        }
      })

      this.state.DroniGateProxyInstance.events.PlotRemoved({}, function(error, event){
         if (error) {
           alert("It was an error removing a plot");
           console.log("Plot removed error "+JSON.stringify(error));
         }else{
           if(event.returnValues._owner === that.state.logged_account){
             that.setState({ success_message: "Plot removed." , show_success: true});
             that.showPlots();
           }
         }
       })

       this.state.DroniGateProxyInstance.events.PlotBlocked({}, function(error, event){
          if (error) {
            alert("It was an error blocking a plot");
            console.log("Plot blocked error "+JSON.stringify(error));
          }else{
            if(event.returnValues._owner === that.state.logged_account){
              that.setState({ success_message: "Plot blocked." , show_success: true});
              that.showPlots();
              that.updateTokens();
            }
          }
        })

     this.state.DroniGateProxyInstance.events.TokensPurchased({}, function(error, event){
        if (error) {
          alert("It was an error purchasing tokens");
          console.log("Purchase token error "+JSON.stringify(error));
        }else{
          if(event.returnValues.addr === that.state.logged_account){
            that.setState({ success_message: "Tokens purchased." , show_success: true});
            that.updateTokens();
          }
        }
      })
  }

  updateTokens = async () => {

    var result = await this.state.DroniGateProxyInstance.methods.getTokens().call({from: this.state.logged_account});
    this.setState({ available_tokens: result });
  }

  showPlots = async () => {

    try{
      var result = await this.state.DroniGateProxyInstance.methods.getAllPlotsByOwner().call({from: this.state.logged_account});
      var _plots = [];
      var ids = result[0];
      var status = result[1];
      var num_plots = result[2];
      var html;

      if(num_plots === 0){
        html = <tr key={0}>
                    <td><h2>No Plots in Database</h2></td>
                  </tr>
        _plots.push(html);
      }else{

        if(ids.length === status.length){
          var i;
          var stat;
          for (i=0; i< num_plots; i++) {
            stat = (status[i])?'Available':'Busy';
            html = <tr key={ids[i]}>
                        <td>Plot id: {ids[i]}</td>
                        <td className="short"><div className={stat.toLowerCase()}>{stat}</div></td>
                        <td className="short"><button value={ids[i]} onClick={e => this.removePlot(e.target.value)}>Remove</button></td>
                      </tr>;
            _plots.push(html);
          }
        }
      }

      this.setState({ plots: _plots });

    } catch(e){
      console.log(e);
      this.props.history.push({  pathname: '/', state: {show_error: true}});
    }
  }

  removePlot = async (plot_id) => {
    var that = this;
    var gasEstimated = await this.state.DroniGateProxyInstance.methods.destroyPlot(plot_id).estimateGas({from: this.state.logged_account, gas: 5000000});
    this.state.DroniGateProxyInstance.methods.destroyPlot(plot_id).send({from: this.state.logged_account, gas:parseInt(gasEstimated)+10000}, function(error, result){
      if(error){
        that.setState({ error_message: "It was an error while removing the plot." , show_error: true});
      }else{
        if(!that.state.events_active){
          setTimeout(function(){
            that.showPlots();
          }, 2000);
        }
      }
    });
  }

  addPlot = (event) => {
    event.preventDefault();

    this.props.history.push({
      pathname: '/plot-manager/add-plot',
      state: {
        email: this.state.email,
        proxy_contract_account: this.state.proxy_contract_account,
        droniGateProxyAbi: this.state.droniGateProxyAbi,
        logged_account: this.state.logged_account,
        plot_token_contract_account: this.state.plot_token_contract_account,
        plot_manager_contract_account: this.state.plot_manager_contract_account,
        dronigate_token_contract_account: this.state.dronigate_token_contract_account
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

  onBuyTokens = async (event) => {
    event.preventDefault();
    if(this.state.selected_tokens > 0){
      var tokens = parseInt(this.state.web3.utils.toWei(this.state.selected_tokens, "ether"));
      var gasEstimated = this.state.DroniGateProxyInstance.methods.buyTokens().estimateGas({from: this.state.logged_account, value: tokens, gas: 5000000});
      var that = this;
      this.state.DroniGateProxyInstance.methods.buyTokens().send(
          {value: tokens, from: this.state.logged_account, gas:parseInt(gasEstimated)+10000}, function(error, result){
        if(error){
          console.log("It was an error while buying tokens "+JSON.stringify(error));
            that.setState({ error_message: "It was an error while buying tokens." , show_error: true});
        }else{
          that.state.DroniGateTokenInstance.methods.increaseAllowance(that.state.proxy_contract_account, that.state.selected_tokens).estimateGas({from: that.state.logged_account, gas: 50000000}, function(error, result){
            if(error){
              console.log("Error increasing allowance "+JSON.stringify(error));
            }
            that.state.DroniGateTokenInstance.methods.increaseAllowance(that.state.proxy_contract_account, that.state.selected_tokens).send({from: that.state.logged_account, gas:parseInt(result)+10000}, function(error, result){
              if(error){
                console.log("It was an error while increasing allowance "+JSON.stringify(error));
                  that.setState({ error_message: "It was an error while increasing allowance." , show_error: true});
              }else{
                that.setState({ success_message: "Tokens purchased. Total amout will appear in a few seconds" , show_success: true});
                if(!that.state.events_active){
                  setTimeout(function(){
                      that.setState({selected_tokens : '' });
                      that.updateTokens();
                  }, 2000);
                }
              }
            });
          });
        }
      });
    }
  }

  onRequestFumigation = async (event) => {
    event.preventDefault();
    try{

      if( this.state.available_tokens === 0){
        this.setState({ error_message: "Request fumigation process returned error." , show_error: true});
      }else{
        if(this.state.selected_plot > 0){
            var that = this;
            var gasEstimated = this.state.DroniGateProxyInstance.methods.requestFumigation(this.state.selected_plot).estimateGas({from: this.state.logged_account, gas: 5000000});
            this.state.DroniGateProxyInstance.methods.requestFumigation(this.state.selected_plot).call({from: this.state.logged_account, gas:parseInt(gasEstimated)+10000}, function(error, result){
              if(error){
                that.setState({ error_message: "Request fumigation process returned error." , show_error: true});
              }else{
                var droneId = result[0];
                var cost = result[1];
                if(droneId == 0){
                  that.setState({ error_message: "There are no drones available for this plot." , show_error: true});
                }else{
                  that.setState({ cost: cost , available_drone: droneId});
                  that.setState({ fumigation_modal: true});
                }
              }
            });
        }
      }
    } catch(e){
      console.log(e);
      this.props.history.push({  pathname: '/', state: {show_error: true}});
    }
  }

  hideFumigationModal = (event) => {
    this.setState({ fumigation_modal: false});
  }

  startFumigation = async (event) => {

    if(this.state.available_drone >= 0 && this.state.selected_plot >= 0){
        var that = this;
        this.state.DroniGateProxyInstance.methods.bookDrone(this.state.selected_plot, this.state.available_drone).estimateGas({from: this.state.logged_account, gas: 50000000}, function(error, result){
          if(error){
            console.log("We couldn't book the drone "+JSON.stringify(error));
            that.setState({ fumigation_modal: false});
            that.setState({ error_message: "We couldn't book the drone, please try again" , show_error: true});
          }else{
            that.state.DroniGateProxyInstance.methods.bookDrone(that.state.selected_plot, that.state.available_drone).send({from: that.state.logged_account, gas:parseInt(result)+10000}, function(error, result){
              that.setState({ fumigation_modal: false});
              if(error){
                  console.log("We couldn't book the drone "+JSON.stringify(error));
                  that.setState({ error_message: "We couldn't book the drone, please try again" , show_error: true});
              }else{
                that.setState({ success_message: "Drone booked. Fumigation process started." , show_success: true});
                if(!that.state.events_active){
                  setTimeout(function(){
                    that.showPlots();
                    that.updateTokens();
                  },2000);
                }
              }
            });
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
            <div id="success_message_title">Plots updated</div>
            <div id="success_message_desc">{this.state.success_message}</div>
            <div id="close" onClick={this.hideAlert}>X</div>
          </div>
        : null }
        {this.state.fumigation_modal ?
          <div id="modal_background" >
            <div id="modal">
              <div id="header">
                <span onClick={this.hideFumigationModal}>Back</span>
              </div>
              <div id="body">
                <h2>The price of the fumigation is: {this.state.cost}</h2>
              </div>
              <div id="footer">
                <button onClick={this.startFumigation}>Fumigate!</button>
              </div>
            </div>
          </div>
        : null }
        <div id="form_container">
          <h1>
            <div>
              <Link to={{ pathname: '/', state:{
                email:this.state.email,
                proxy_contract_account: this.state.proxy_contract_account,
                dronigate_token_contract_account: this.state.dronigate_token_contract_account,
                plot_token_contract_account: this.state.plot_token_contract_account,
                plot_manager_contract_account: this.state.plot_manager_contract_account,
                droniGateProxyAbi: this.state.droniGateProxyAbi
              } }}>Sign out</Link>
            </div>
          </h1>
          <div className="appnitro">
    					<div className="form_description">
          			<h2>Plot control panel</h2>
                <p style={{float: 'right'}}>Tokens avaiable: {this.state.available_tokens }</p>
                <br />
          		</div>
              <div id="li_1">
                <h4>Plots status</h4>
                <div>
                  <table>
                    <tbody>
                      {this.state.plots}
                    </tbody>
                  </table>
                </div>
              </div>
              <hr />
              <div className="buttons">
                <button onClick={this.addPlot}>Add Plot</button>
              </div>
              <div className="buttons">
                <form onSubmit={this.onRequestFumigation} className="appnitro">
                  <div className="buttons">
                    <label className="description" htmlFor="tokens">Request fumigation</label>
                    <input id="element_1" className="element text small" type="tokens" name="selected_plot" placeholder="Select plot to be fumigated" onChange={this.handleChange} value={this.state.selected_plot}/>
                    <input id="saveForm" className="button_text" type="submit" name="submit" value="Request Fumigation" style={{marginLeft: "30px"}}/>
                  </div>
                </form>
              </div>
              <div className="buttons">
                <form onSubmit={this.onBuyTokens} className="appnitro">
                  <div className="buttons">
                    <label className="description" htmlFor="tokens">Buy tokens</label>
                    <input id="element_2" className="element text small" type="tokens" name="selected_tokens" placeholder="Select number of tokens" onChange={this.handleChange} value={this.state.selected_tokens}/>
                    <input id="saveForm" className="button_text" type="submit" name="submit" value="Buy tokens" style={{marginLeft: "30px"}}/>
                  </div>
                </form>
              </div>
            </div>
        	</div>
      </div>
    );
  }
}

export default PlotManager;
