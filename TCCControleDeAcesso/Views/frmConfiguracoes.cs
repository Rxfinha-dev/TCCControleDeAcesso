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
            var portList = new Dictionary<string, string>();
            try
            {
                using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_PnPEntity WHERE Caption like '%(COM%'"))
                {
                    var portNames = SerialPort.GetPortNames();
                    foreach (var port in searcher.Get().Cast<ManagementBaseObject>())
                    {
                        var caption = port["Caption"]?.ToString() ?? "Unknown";
                        var realPort = portNames.FirstOrDefault(p => caption.Contains($"({p})"));
                        if (realPort != null && !portList.ContainsKey(realPort))
                        {
                            portList.Add(realPort, caption);
                        }
                    }
                }
            }
            catch (ManagementException)
            {
            }

            if (portList.Count > 0)
            {
                combo.DataSource = new BindingSource(portList, null);
                combo.DisplayMember = "Value";
                combo.ValueMember = "Key";
                var comUsb = portList.FirstOrDefault(par => par.Value.StartsWith("USB", StringComparison.OrdinalIgnoreCase));
                combo.SelectedItem = comUsb.Key;
            }
            else
            {
                combo.SelectedIndex = -1;
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
            comboBoxPortas.Enabled = false;
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
            comboBoxPortas.Enabled = true;
        }

       
    }
}