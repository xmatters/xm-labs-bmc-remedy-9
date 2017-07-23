# BMC Remedy 9 - ITSM - Incident
Notify on-call response teams when critical incidents are reported in Remedy. With the xMatters & BMC Remedy ITSM 9.1 integration, the on-call members of resolver teams can be automatically notified via multiple communication channels.

Information about the incident or change request will be presented to the message recipients and direct actions can be made in real-time which can update the assignee or status of the ticket. As actions are taken, xMatters will update the tickets with informational annotations providing a full audit trail.

This is an experimental integration as our workshop engineers in the great white north have not validated it works for Remedy 9. It has been field tested however, and it should work. If any issues are encountered, open an issue [here](https://github.com/xmatters/xm-labs-bmc-remedy-9/issues) and we'll get it looked at. 

# Pre-Requisites
* BMC Remedy ITSM 9.1 **On Premise**
* xMatters account - If you don't have one, [get one](https://www.xmatters.com)!
* xMatters Integration Agent 5.8.1 - Downloads and install docs are [here](https://support.xmatters.com/hc/en-us/articles/201463419-Integration-Agent-for-xMatters-5-x-xMatters-On-Demand)

# Files
* [xM_BMC_Remedy_Incident_Management_5_1_2-xMLabs.zip](xM_BMC_Remedy_Incident_Management_5_1_2-xMLabs.zip) - Zip file containing all necessary files: Comm Plan, Integration Agent files and Remedy files
* [xM-BMC-Remedy_Incident_Management_5_1_2.pdf](xM-BMC-Remedy_Incident_Management_5_1_2.pdf) - Documentation pdf for all installation steps.


# How it works
1. BMC Remedy triggers one of the xMatters filters provided as part of the integration.
2. The filter sends a SOAP web service request to the integration service.
3. The integration service processes the request, using web services exposed by BMC Remedy to obtain information about the incident that has been updated.
l This information is used to construct a message that is sent to xMatters via the xMatters REST API.
4. In the case of an incident update, xMatters notifies the appropriate recipients, and passes the recipient responses back to
the Integration Agent.
5. The Integration Agent passes the response to the integration service, which updates the incident in BMC Remedy via web service requests.


# Installation
For the rest of the details, see the [xM-BMC-Remedy_Incident_Management_5_1_2.pdf](xM-BMC-Remedy_Incident_Management_5_1_2.pdf) document. 

