import {JitsiMeetJS} from '@base';

// *_: Misc
export const analytics = JitsiMeetJS.analytics;
export const browser = JitsiMeetJS.util.browser;
export const JitsiDetectionEvents = JitsiMeetJS.events.detection;
export const JitsiE2ePingEvents = JitsiMeetJS.events.e2eping;
export const JitsiRecordingConstants = JitsiMeetJS.constants.recording;
export const JitsiSIPVideoGWStatus = JitsiMeetJS.constants.sipVideoGW;

// *_: Conference
export const JitsiConferenceErrors = JitsiMeetJS.errors.conference;
export const JitsiConferenceEvents = JitsiMeetJS.events.conference;

// *_: Connection
export const JitsiConnectionErrors = JitsiMeetJS.errors.connection;
export const JitsiConnectionEvents = JitsiMeetJS.events.connection;
export const JitsiConnectionQualityEvents =
  JitsiMeetJS.events.connectionQuality;
export const JitsiParticipantConnectionStatus =
  JitsiMeetJS.constants.participantConnectionStatus;

// *_: Media Devices
export const JitsiMediaDevicesEvents = JitsiMeetJS.events.mediaDevices;

// *_: Track
export const JitsiTrackErrors = JitsiMeetJS.errors.track;
export const JitsiTrackEvents = JitsiMeetJS.events.track;

export {JitsiMeetJS};
