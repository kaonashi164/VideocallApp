export type TUser = {
  _id: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  isOnline: boolean;
};

export type TCall = {
  _id: string;
  createdAt: number;
  createdBy: TUser;
  status: string;
  receiver: TUser;
  startedAt: number;
  endedAt: number;
  isVideoCall: boolean;
  isVoiceCall: boolean;
  isRecord: boolean;
};
