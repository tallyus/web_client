import { EventEmitter } from "events";
import dispatcher from "../dispatcher";
import AuthStore from './AuthStore';
import { collections } from 'lodash';
import request from 'reqwest';
import when from 'when';
import * as Constants from '../constants/EventConstants';


class EventStore extends EventEmitter {
  constructor() {
    super()
  }

  getEvents() {
    return this.eventObjs || [];
  }

  getBreakingId() {
    return this.breakingId || '';
  }

  getEvent() {
    return this.eventObj || {
      eventId: '',
      isPinned: '',
      breakingId: '',
      isPublished: '',
      imageUrl: '',
      imageAttribution: '',
      politicianId: '',
      headline: '',
      summary: ''
    };
  }

  getMessage() {
    return this.message;
  };

  getError() {
    return this.error;
  };

  getPinnedId() {
    return this.pinnedId;
  }

  getPublishChangeId() {
    return this.publishChangeId || '';
  }

  fetchEvents(offset) {
    var that = this;
    const url = Constants.GET_EVENTS;
    const tokenLocal = AuthStore.getAuthToken() || '';

    if (tokenLocal === '') {
      return;
    }

    return when(request({
      url: url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      data: {
        offset: offset
      },
      headers: {
        authorization: "Bearer " + tokenLocal
      }
    }))
    .then(function(response) {
      that.eventObjs = response;
      _(response).forEach(function(eventObj) {
        if (eventObj.isPinned === true) {
          that.pinnedId = eventObj.id;
          that.emit('change');
        }
        if (eventObj.breakingId === true) {
          that.breakingId = eventObj.id;
          that.emit('change');
        }
      });
      that.emit('change');
    })
    .catch(function(response) {
      if ((response.status !== 200) || response.status !== 304) {
        console.log("Error loading eventObjs", response);
      }
    })
  }

  fetchAdminEvents(offset) {
    var that = this;
    const url = Constants.GET_ADMIN_EVENTS;
    const tokenLocal = AuthStore.getAuthToken();

    return when(request({
      url: url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      data: {
        offset: offset
      },
      headers: {
        authorization: "Bearer " + tokenLocal
      }
    }))
    .then(function(response) {
      that.eventObjs = response;
      _(response).forEach(function(eventObj) {
        if (eventObj.isPinned === true) {
          that.pinnedId = eventObj.id;
          that.emit('change');
        }
        if (eventObj.breakingId === true) {
          that.breakingId = eventObj.id;
          that.emit('change');
        }
      });
      that.emit('change');
    })
    .catch(function(response) {
      if ((response.status !== 200) || response.status !== 304) {
        console.log("Error loading eventObjs", response);
      }
    })
  }

  fetchEvent(eventId) {
    var that = this;
    const url = Constants.GET_EVENT;
    const tokenLocal = AuthStore.getAuthToken();

    return when(request({
      url: url + eventId,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        authorization: "Bearer " + tokenLocal
      }
    }))
    .then(function(response) {
      var eventObj = {}
      eventObj['eventId'] = response.id || '';
      eventObj['isPinned'] = response.isPinned || '';
      eventObj['breakingId'] = response.breakingId || '';
      eventObj['isPublished'] = response.isPublished || '';
      eventObj['imageUrl'] = response.imageUrl || '';
      eventObj['imageAttribution'] = response.imageAttribution || '';
      eventObj['politicianId'] = response.politicianId || '';
      eventObj['headline'] = response.headline || '';
      eventObj['summary'] = response.summary || '';
      that.eventObj = eventObj;
      that.emit('change');
    })
    .catch(function(response) {
      if (((response.status !== 200) || response.status !== 304) || response.status !== 304) {
        alert("There is an error loading eventObj");
        console.log("Error loading eventObj", response);
        // that.emit('change');
      }
    });
  }

  fetchAdminEvent(eventId) {
    var that = this;
    const url = Constants.GET_ADMIN_EVENT;
    const tokenLocal = AuthStore.getAuthToken();

    return when(request({
      url: url + eventId,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        authorization: "Bearer " + tokenLocal
      }
    }))
    .then(function(response) {
      var eventObj = {}
      eventObj['eventId'] = response.id || '';
      eventObj['isPinned'] = response.isPinned || '';
      eventObj['breakingId'] = response.breakingId || '';
      eventObj['isPublished'] = response.isPublished || '';
      eventObj['imageUrl'] = response.imageUrl || '';
      eventObj['imageAttribution'] = response.imageAttribution || '';
      eventObj['politicianId'] = response.politicianId || '';
      eventObj['headline'] = response.headline || '';
      eventObj['summary'] = response.summary || '';
      that.eventObj = eventObj;
      that.emit('change');
    })
    .catch(function(response) {
      if (((response.status !== 200) || response.status !== 304) || response.status !== 304) {
        alert("There is an error loading eventObj");
        console.log("Error loading eventObj", response);
        // that.emit('change');
      }
    });
  }

  updateEvent(eventId, eventInfo) {
    const tokenLocal = AuthStore.getAuthToken();
    const url = Constants.UPDATE_EVENT;

    var res = Promise.resolve(
      request({
        url: url + eventId,
        type: 'json',
        crossOrigin: true,
        method: 'PUT',
        headers: {
          authorization: "Bearer " + tokenLocal
        },
        data: {
          event: eventInfo
        }
      })
    );
    this.emit('change');
  }

  pinEvent(eventId) {
    const tokenLocal = AuthStore.getAuthToken();
    const url = Constants.PIN_EVENT;
    var that = this;

    return when(request({
      url: url + eventId + '/pin',
      method: 'PUT',
      crossOrigin: true,
      type: 'json',
      headers: {
        authorization: "Bearer " + tokenLocal
      },
      data: {
        eventId: eventId
      }
    }))
    .then(function(response) {
      that.message = "Event Pinned Successfully";
      that.error = '';
      that.pinnedId = eventId;
      that.emit('change');
    })
    .catch(function(response) {
      if (response.status !== 200 || response.status !== 304) {
        that.error = "Error Pinning Event";
      }
    });
  }

  setBreaking(eventId) {
    const tokenLocal = AuthStore.getAuthToken();
    const url = Constants.SET_BREAKING;
    var that = this;

    return when(request({
      url: url + eventId + '/setBreaking',
      method: 'PUT',
      crossOrigin: true,
      type: 'json',
      headers: {
        authorization: "Bearer " + tokenLocal
      },
      data: {
        eventId: eventId
      }
    }))
    .then(function(response) {
      that.message = "Breaking event set Successfully";
      that.error = '';

      var eventObj = {}
      eventObj['eventId'] = response.id || '';
      eventObj['breakingId'] = response.id || '';
      eventObj['headline'] = response.headline || '';
      eventObj['createdAt'] = response.createdAt || '';
      that.breakingId = eventId;
      that.eventObj = eventObj;
      that.emit('change');

    })
    .catch(function(response) {
      if (response.status !== 200 || response.status !== 304) {
        that.error = "Error setting breaking Event";
      }
    });
  }

  unSetBreaking() {
    const tokenLocal = AuthStore.getAuthToken();
    const url = Constants.UNSET_BREAKING;
    var that = this;

    return when(request({
      url: url,
      method: 'PUT',
      crossOrigin: true,
      type: 'json',
      headers: {
        authorization: "Bearer " + tokenLocal
      }
    }))
    .then(function(response) {
      var eventObj = {}
      that.message = "Breaking event unset Successfully";
      that.breakingId = '';
      that.error = '';
      that.eventObj = eventObj;
      that.emit('change');
    })
    .catch(function(response) {
      if (response.status !== 200 || response.status !== 304) {
        that.error = "Error unsetting breaking Event";
      }
    });
  }

  fetchBreaking() {
    const url = Constants.FETCH_BREAKING_EVENT;
    var that = this;

    return when(request({
      url: url,
      method: 'GET',
      crossOrigin: true,
      type: 'json'
    }))
    .then(function(response) {
      // that.eventObj = response;
      var eventObj = {}
      eventObj['eventId'] = response.id || '';
      eventObj['breakingId'] = response.id || '';
      eventObj['headline'] = response.headline || '';
      eventObj['createdAt'] = response.createdAt || '';
      that.breakingId = response.id || '';
      that.eventObj = eventObj;
      that.emit('change');
    })
    .catch(function(response) {
      if (response.status !== 200 || response.status !== 304) {
        console.log("Error fetching breaking Event");
      }
    });
  }

  togglePublish(eventId) {
    const tokenLocal = AuthStore.getAuthToken();
    const url = Constants.TOGGLE_PUBLISH_EVENT;
    var that = this;

    return when(request({
      url: url + eventId + '/toggle_publish',
      method: 'PUT',
      crossOrigin: true,
      type: 'json',
      headers: {
        authorization: "Bearer " + tokenLocal
      },
      data: {
        eventId: eventId
      }
    }))
    .then(function(response) {
      var publishText = response.isPublished ? 'Published' : 'Un-Published';
      that.isPublished = response.isPublished;
      that.publishChangeId = eventId;
      that.message = 'Event ' + publishText + ' Successfully';
      that.error = '';
      that.emit('change');
    })
    .catch(function(response) {
      if (response.status !== 200 || response.status !== 304) {
        that.error = "Error changing publish status of Event";
      }
    });
  }

  createEvent(eventInfo) {
    const url = Constants.CREATE_EVENT;
    const tokenLocal = AuthStore.getAuthToken();
    var that = this;

    return when(request({
      url: url,
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      headers: {
        authorization: "Bearer " + tokenLocal
      },
      data: {
        event: eventInfo
      }
    }))
    .then(function(response) {
      that.message = 'Event created successfully';
      that.error = '';
      // that.emit('change');
    })
    .catch(function(response) {
      if (response.status !== 200 || response.status !== 304) {
        that.message = '';
        that.error = "Error creating Event";
      }
    });
    this.emit('change');
  }

  addChangeListener(callback) {
    this.on('change', callback);
  }

  removeChangeListener(callback) {
    this.removeListener('change', callback);
  }

  handleActions(action) {
    // console.log("EventStore received an action", action);

    switch(action.type) {
      case "FETCH_EVENTS": {
        this.fetchEvents(action.offset);
        break;
      }
    }
    switch(action.type) {
      case "FETCH_ADMIN_EVENTS": {
        this.fetchAdminEvents(action.offset);
        break;
      }
    }
    switch(action.type) {
      case "FETCH_EVENT": {
        this.fetchEvent(action.eventId);
        break;
      }
    }
    switch(action.type) {
      case "FETCH_ADMIN_EVENT": {
        this.fetchAdminEvent(action.eventId);
        break;
      }
    }

    switch(action.type) {
      case "UPDATE_EVENT": {
        this.updateEvent(action.eventId, action.eventInfo);
        break;
      }
    }
    switch(action.type) {
      case "PIN_EVENT": {
        this.pinEvent(action.eventId);
        break;
      }
    }
    switch(action.type) {
      case "SET_BREAKING_NEWS_EVENT": {
        this.setBreaking(action.eventId);
        break
      }
    }
    switch(action.type) {
      case "UNSET_BREAKING_NEWS_EVENT": {
        this.unSetBreaking();
        break
      }
    }
    switch(action.type) {
      case "FETCH_BREAKING_EVENT": {
        this.fetchBreaking();
        break
      }
    }
    switch(action.type) {
      case "TOGGLE_PUBLISH_EVENT": {
        this.togglePublish(action.eventId);
        break;
      }
    }
    switch(action.type) {
      case "CREATE_EVENT": {
        this.createEvent(action.eventInfo);
        break;
      }
    }
  }
}

const eventStore = new EventStore;
dispatcher.register(eventStore.handleActions.bind(eventStore));

export default eventStore;
