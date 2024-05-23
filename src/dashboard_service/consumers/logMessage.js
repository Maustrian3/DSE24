import { getConnection, releaseConnection } from "../../common/db.js";
import { insertLogLine } from "../query.js";



export function logMessage( sseChannel ) {

  return async function logMessageConsumer( msg ) {
    const msgJson= msg.content.toString();
    const content= JSON.parse( msgJson );

    let conn;
    try {
      conn= await getConnection();

      const { time, severity, message, type, data }= content;
      await insertLogLine( conn, new Date(time), severity, message, type, data );

    } finally {
      releaseConnection( conn );
    }

    sseChannel.broadcast( content );
  };
}
