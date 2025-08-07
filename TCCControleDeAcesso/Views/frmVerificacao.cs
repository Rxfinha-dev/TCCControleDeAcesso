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
        public frmVerificacao()
        {
            InitializeComponent();
            if (serialPort.IsOpen)
            {
                serialPort.Write("!verify#");
            }
        }

        private void serialPort_DataReceived(object sender, SerialDataReceivedEventArgs e)
        {
            this.Invoke(new EventHandler(serialPort_DataReceived));
        }

        private void serialPort_DataReceived(object sender, EventArgs e)
        {
            string received = serialPort.ReadLine();

            if (received.StartsWith("#found"))
            {
                received.Replace("!found", "");
                received.Replace("#", "");
                aluno.Text = received;
            }
        }
    }
}
