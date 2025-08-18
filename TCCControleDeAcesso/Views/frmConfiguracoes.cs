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
        bool connected;
        string[] ports;
        string selectedPort;

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
            if (comboBoxPortas.SelectedItem != null)
            {
                selectedPort = comboBoxPortas.SelectedItem.ToString();
                if (selectedPort != "")
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
            }
        }

        void connect()
        {
            selectedPort = comboBoxPortas.SelectedItem.ToString();
            SerialPortManager.Port.PortName = selectedPort;
            SerialPortManager.Port.Open();
            connected = true;
            progressBarConectado.Value = 100;
            bntConectar.Text = "Desconectar";
        }

        void disconnect()
        {
            SerialPortManager.Port.Close();
            connected = false;
            progressBarConectado.Value = 0;
            bntConectar.Text = "Conectar";
        }
    }
}