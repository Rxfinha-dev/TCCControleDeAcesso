using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.IO.Ports;
using System.Web.UI;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmConfiguracoes : Form
    {
        Arduino arduino = new Arduino();
        bool connected;
        String[] ports;
        SerialPort port;

        public frmConfiguracoes()
        {
            InitializeComponent();
            ports = SerialPort.GetPortNames();

            foreach (string port in ports)
            {
                comboBoxPortas.Items.Add(port);
            }
        }

        private void bntConectar_Click(object sender, EventArgs e)
        {
            if (!connected)
            {
                connect();
            }
            else if (connected)
            {
                disconnect();
            }
        }

        void connect()
        {
            string selectedPort = comboBoxPortas.SelectedItem.ToString();
            arduino.connect(selectedPort);
            connected = true;
            progressBarConectado.Value = 100;
            bntConectar.Text = "Desconectar";
        }

        void disconnect()
        {
            arduino.disconnect();
            connected = false;
            progressBarConectado.Value = 0;
            bntConectar.Text = "Conectar";
        }

        public static void dataReceived(string received)
        {
            //serial(received);
        }

        void serial(string received)
        {
            richTextBoxSerial.Text = richTextBoxSerial.Text + received;
        }
    }
}
