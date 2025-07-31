using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace TCCControleDeAcesso.Views
{
    public partial class frmVerificacao : Form
    {
        SerialPort port;

        public frmVerificacao()
        {
            InitializeComponent();
        }

        void port_DataReceived(object sender, System.IO.Ports.SerialDataReceivedEventArgs e)
        {
            string received = port.ReadLine();

            if (received.StartsWith("#found"))
            {
                received.Replace("!found", "");
                received.Replace("#", "");
                aluno.Text = received;
            }
        }
    }
}
