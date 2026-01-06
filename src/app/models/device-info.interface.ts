/**
 * Interfaces relacionadas con información del dispositivo
 */

export interface DeviceInfoResponse {
  bucId?: string;
  partyId?: string;
  additionalInfo: {
    AppVersion: string;
    DeviceModel: string;
    DeviceSystemName: string;
    DeviceSystemVersion?: string;
    DeviceManufacturer?: string;
  };
}

