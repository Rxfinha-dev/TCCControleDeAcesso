using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TCCControleDeAcesso.Views;

namespace TCCControleDeAcesso.Models
{
    public class Arduino
    {
        public SerialPort port;

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
            string received = port.ReadLine();
            frmConfiguracoes.dataReceived(received);
        }
    }
}
