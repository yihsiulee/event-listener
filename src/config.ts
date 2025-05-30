import dotenv from "dotenv";
dotenv.config();

export const config = {
  RPC_URL: process.env.RPC_URL || "",
  CONTRACT_ADDRESS: "0xbfe6a3023C92B040f95B8c2e8C237AAf0AFc92AB",
  ABI: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "index",
          type: "uint256",
        },
        { indexed: false, internalType: "bool", name: "success", type: "bool" },
        {
          indexed: false,
          internalType: "uint256",
          name: "passthrough",
          type: "uint256",
        },
      ],
      name: "Result",
      type: "event",
    },
  ],
};
