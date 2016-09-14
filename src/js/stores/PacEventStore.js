import { EventEmitter } from "events";
import dispatcher from "../dispatcher";
import Promise from 'bluebird';
import AuthStore from './AuthStore';
import * as Constants from '../constants/PacEventConstants';
import request from 'reqwest';
import when from 'when';

class PacEventStore extends EventEmitter {
  constructor() {
    super()
  }

  getPacEvents() {
    return this.pacEvents || [];
  }

  getSupportPacEvents() {
    return this.supportPacEvents || [];
  }

  getOpposePacEvents() {
    return this.opposePacEvents || [];
  }

  getPacEvent() {
    return this.pacEvent || {
      pacEventId: '',
      support: '',
      eventId: '',
      pacId: ''
    };
  }

  getMessage() {
    return this.message;
  };

  getError() {
    return this.error;
  };

  fetchPacEvents(eventId, support) {
    var that = this;
    const urlBase = Constants.GET_PAC_EVENTS;
    const tokenLocal = AuthStore.getAuthToken();
    var url = urlBase + eventId + '/pac_events?include_pacs=true';

    return when(request({
      url: url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        authorization: "Bearer " + tokenLocal
      }
    }))
    .then(function(response) {
      that.pacEvents = response || [];

      that.error = '';
      that.emitEvent();
    })
    .catch(function(response) {
      if (response.status !== 200 || response.status !== 304) {
        that.error = 'There is an error loading pacs';
        console.log("Error loading pacs", response);
        that.emitEvent();
      }
    });
  }

  fetchPacEvent(eventId, pacEventId) {
    var that = this;
    const url = Constants.GET_PAC_EVENT;
    const tokenLocal = AuthStore.getAuthToken();

    return when(request({
      url: url + eventId + '/pac_events/' + pacEventId,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        authorization: "Bearer " + tokenLocal
      }
    }))
    .then(function(response) {
      var pacEvent = {};
      pacEvent['pacEventId'] = response.id || '';
      pacEvent['support'] = response.name || '';
      pacEvent['eventId'] = response.description || '';
      pacEvent['pacId'] = response.twitterUsername || '';
      that.pacEvent = pacEvent;
      that.emitEvent();
    })
    .catch(function(response) {
      if (response.status !== 200 || response.status !== 304) {
        console.log("Error loading pac", response);
      }
    });
  }

  updatePacEvent(eventId, pacEventId, pacEventInfo) {
    const tokenLocal = AuthStore.getAuthToken();
    const url = Constants.UPDATE_PAC_EVENT;

    var res = Promise.resolve(
      request({
        url: url + eventId + '/pac_events/' + pacEventId,
        type: 'json',
        crossOrigin: true,
        method: 'PUT',
        headers: {
          authorization: "Bearer " + tokenLocal
        },
        data: {
          pacEvent: pacEventInfo
        }
      })
    );
    this.emitEvent();
  }

  createPacEvent(eventId, pacInfo) {
    const tokenLocal = AuthStore.getAuthToken();
    const url = Constants.CREATE_PAC_EVENT;

    var res = Promise.resolve(
      request({
        url: url + eventId + '/pac_events',
        type: 'json',
        crossOrigin: true,
        method: 'POST',
        headers: {
          authorization: "Bearer " + tokenLocal
        },
        data: {
          pacEvent: pacInfo
        }
      })
    );
    this.emitEvent();
  }

  deletePacEvent(eventId, pacEventId) {
    const tokenLocal = AuthStore.getAuthToken();
    const url = Constants.DELETE_PAC_EVENT;

    var res = Promise.resolve(
      request({
        url: url + eventId + '/pac_events/' + pacEventId,
        type: 'json',
        crossOrigin: true,
        method: 'DELETE',
        headers: {
          authorization: "Bearer " + tokenLocal
        }
      })
    );
    this.emitEvent();
  }

  addChangeListener(callback) {
    this.on('pacEventChange', callback);
  }

  removeChangeListener(callback) {
    this.removeListener('pacEventChange', callback);
  }

  emitEvent() {
    this.emit('pacEventChange');
  }

  handleActions(action) {
    // console.log("PacEventStore received an action", action);

    switch(action.type) {
      case "FETCH_PAC_EVENTS": {
        this.fetchPacEvents(action.eventId, action.support);
        break;
      }
      case "FETCH_PAC_EVENT": {
        this.fetchPacEvent(action.eventId, action.pacEventId);
        break;
      }
      case "UPDATE_PAC_EVENT": {
        this.updatePacEvent(action.eventId, action.pacEventId, action.pacEventInfo);
        break;
      }
      case "CREATE_PAC_EVENT": {
        this.createPacEvent(action.eventId, action.pacEventInfo);
        break;
      }
      case "DELETE_PAC_EVENT": {
        this.deletePacEvent(action.eventId, action.pacEventId);
        break;
      }
    }
  }
}

const pacEventStore = new PacEventStore;
dispatcher.register(pacEventStore.handleActions.bind(pacEventStore));

export default pacEventStore;
