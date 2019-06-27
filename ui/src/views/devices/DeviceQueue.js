import React, { Component } from "react";
import { withRouter } from 'react-router-dom';
import { withStyles } from "@material-ui/core/styles";

import JSONTree from "../../components/JSONTree";

import swal from 'sweetalert2'

import Grid from "@material-ui/core/Grid";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import Modal from "@material-ui/core/Modal"
import Button from "@material-ui/core/Button";
import Plus from "mdi-material-ui/Plus";
import Delete from "mdi-material-ui/Delete";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from "@material-ui/core/FormHelperText";
import Checkbox from '@material-ui/core/Checkbox';
import CircularProgress from "@material-ui/core/CircularProgress";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';

import Admin from "../../components/Admin";
import DeviceQueueStore from "../../stores/DeviceQueueStore";


function getModalStyle() {

  return {
    top: `45%`,
    left: `45%`,
    transform: `translate(-45%, -45%)`,
  };
}

const styles = theme => ({
  paper: {
    position: 'absolute',
    width: theme.spacing.unit * 50,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
	},
	buttons: {
    textAlign: "right",
  },
  button: {
    marginLeft: 2 * theme.spacing.unit,
  },
  icon: {
    marginRight: theme.spacing.unit,
  },
});

class QueueMessage extends Component {
  render() {

		const message = this.props.message;
		
		const confirmed = message.confirmed ? "True" : "False";
		const jsonData = message.jsonObject === "" ? "" : <JSONTree data={message.jsonObject} />;

    return(

			<TableRow key={this.props.index}>
        <TableCell>{confirmed}</TableCell>
        <TableCell>{message.fPort}</TableCell>
        <TableCell>{message.data}</TableCell>
        <TableCell>{jsonData}</TableCell>
      </TableRow>
    );
  }
}


class DeviceQueue extends Component {
  constructor() {
    super();
    this.state = {
			deviceQueueItems: [],
			deviceQueueItem: {jsonObject: ""},
			modalOpen: false,
			sending: false,
		};
		this.flushQueue = this.flushQueue.bind(this);
		this.enqueueMessage = this.enqueueMessage.bind(this);
		this.openModal = this.openModal.bind(this);
		this.closeModal = this.closeModal.bind(this);
		this.onChange = this.onChange.bind(this);
  }


  componentDidMount() {
    DeviceQueueStore.list(this.props.match.params.devEUI, (response) => {
			if(response) {
				this.setState({
					deviceQueueItems: response.deviceQueueItems,
				});
			}
		});
  }

  componentWillUnmount() {

	}
	
	flushQueue() {

		swal({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Confirm'
		}).then((result) => {
			if (result.value) {
				DeviceQueueStore.flush(this.props.match.params.devEUI, (response) => {
					this.componentDidMount();
					swal(
						'Flushed!',
						'The queue has been completely flushed.',
						'success'
					);
				});
			}
		})

		
	}

	openModal() {
		this.setState({
			modalOpen: true,
			deviceQueueItem: {devEUI: this.props.match.params.devEUI, jsonObject: ""},
			sending: false,
		});
	}

	closeModal() {
		this.setState({
			modalOpen: false,
			deviceQueueItem: {devEUI: this.props.match.params.devEUI, jsonObject: ""},
			sending: false,
		})
	}

	enqueueMessage(e) {
		this.setState({
			sending: true,
		});
		e.preventDefault();
		let deviceQueueItem = this.state.deviceQueueItem;
		DeviceQueueStore.enqueue(this.props.match.params.devEUI, deviceQueueItem, (response) => {
			
			if(response && response.fCnt > 0) {
				swal(
					'Success!',
					'The message hass been added to the queue.',
					'success'
				);
			}
			this.componentDidMount();
			this.closeModal();
		});
	}

	onChange(e) {
		let newQueueItem = this.state.deviceQueueItem;
		let lookup = e.target.id.split(".");
    const field = lookup[lookup.length-1];
    lookup.pop(); // remove last item
    if (e.target.type === "checkbox")
    {
      newQueueItem[field] = e.target.checked;
    }
    else if(e.target.type === "number")
    {
      newQueueItem[field] = parseInt(e.target.value, 10);
    }
    else
    {
      newQueueItem[field] = e.target.value;
    }
    
		this.setState({
			deviceQueueItem: newQueueItem,
		});
	}

  render() {
		const QueueMessages = this.state.deviceQueueItems.map((deviceQueueItem, i) => <QueueMessage key={i} index={i} message={deviceQueueItem} />);

    return (
			<div>
				<Grid container spacing={24}>
					<Admin organizationID={this.props.match.params.organizationID}>
						<Grid item xs={12}>
							<Button variant="outlined" color="primary" className={this.props.classes.button} onClick={this.openModal}>
								<Plus className={this.props.classes.icon} />
								Create
							</Button>
							<Button variant="outlined" color="secondary" className={this.props.classes.button} onClick={this.flushQueue}>
								<Delete className={this.props.classes.icon} />
								Flush
							</Button>
						</Grid>
					</Admin>
					<Grid item xs={12}>
						<Paper>
							<Table className={this.props.classes.table}>
								<TableHead>
									<TableRow>
										<TableCell>Confirmed</TableCell>
										<TableCell>FPort</TableCell>
										<TableCell>Data</TableCell>
										<TableCell>JSON Object</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{QueueMessages}
								</TableBody>
							</Table>
						</Paper>
					</Grid>
				</Grid>

				<Modal
          aria-labelledby="Enqueue message"
          aria-describedby="Enqueue a message for downlink"
          open={this.state.modalOpen}
          onClose={this.closeModal}
        >
					<div style={getModalStyle()} className={this.props.classes.paper}>
						<form onSubmit={this.enqueueMessage}>
							<FormControl fullWidth margin="normal">
								<FormControlLabel
									label="Confirmed"
									control={
										<Checkbox
											id="confirmed"
											checked={!!this.state.deviceQueueItem.confirmed}
											onChange={this.onChange}
											color="primary"
										/>
									}
								/>
								<FormHelperText>
									Should the device send an ACK on this downlink message.
								</FormHelperText>
							</FormControl>
							<TextField
								id="fPort"
								label="Fport"
								type="number"
								fullWidth={true}
								margin="normal"
								value={this.state.deviceQueueItem.fPort || ""}
								onChange={this.onChange}
							/>
							<TextField
								id="data"
								label="Data"
								fullWidth={true}
								margin="normal"
								value={this.state.deviceQueueItem.data || ""}
								onChange={this.onChange}
							/>
							<TextField
								id="jsonObject"
								label="JsonObject"
								fullWidth={true}
								margin="normal"
								value={this.state.deviceQueueItem.jsonObject || ""}
								onChange={this.onChange}
							/>
							<Grid container justify="flex-end" className={this.props.classes.formControl}>
								<Button color="primary" onClick={this.closeModal}>Cancel</Button>
								<Button color="primary" type="submit" disabled={this.state.sending}>
									{
										this.state.sending ?
										<CircularProgress size={14} /> : // Size 14 works pretty well
										"Submit"
									}
								</Button>
							</Grid>
						</form>
					</div>
				</Modal>
			</div>
    );
  }
}

export default withStyles(styles)(withRouter(DeviceQueue));
