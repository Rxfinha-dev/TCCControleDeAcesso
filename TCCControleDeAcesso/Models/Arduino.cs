using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TCCControleDeAcesso.Models
{
    public class Arduino
    {
        SerialPort port;
        public void connect(string selectedPort)
        {
            port = new SerialPort(selectedPort, 9600);
            port.Open();
        }

        public void disconnect()
        {
            port.Close();
        }

        public void port_DataReceived(object sender, System.IO.Ports.SerialDataReceivedEventArgs e)
        {
        }
    }
}
