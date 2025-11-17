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
using System.Management;
using RJCodeAdvance.RJControls;

namespace TCCControleDeAcesso.Views
{
    public partial class frmConfiguracoes : Form
    {
        bool connected;

        public frmConfiguracoes()
        {
            InitializeComponent();
            listCom(comboBoxPortas);
        }

        private void listCom(RJComboBox combo)
        {
            string[] ports = SerialPort.GetPortNames();

            foreach (string port in ports)
            {
                combo.Items.Add(port);
            }
        }

        private void bntConectar_Click(object sender, EventArgs e)
        {
            comboBoxPortas.Enabled = false;
            if (comboBoxPortas.SelectedItem != null)
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

        void connect()
        {
            string selectedPort = comboBoxPortas.SelectedItem.ToString();
            SerialPortManager.Port.PortName = selectedPort;
            SerialPortManager.Port.Open();
            connected = true;
            progressBarConectado.Value = 100;
            bntConectar.Text = "Desconectar";
            comboBoxPortas.Enabled = false;
        }

        void disconnect()
        {
            SerialPortManager.Port.Close();
            connected = false;
            progressBarConectado.Value = 0;
            bntConectar.Text = "Conectar";
            comboBoxPortas.Enabled = true;
        }

        private void frmConfiguracoes_Load(object sender, EventArgs e)
        {
        }
    }
}