using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmExcluir : Form
    {
        public frmExcluir()
        {
            InitializeComponent();
            SerialPortManager.Port.DataReceived += serialPort_DataReceived;
        }

        private void serialPort_DataReceived(object sender, EventArgs e)
        {
            string received = SerialPortManager.Port.ReadLine();
            acao.Invoke(new Action(() => {
                if (received.StartsWith("!deleted"))
                {
                    received = received.Replace("!deleted", "");
                    received = received.Replace("#", "");
                    acao.Text = "ID" + received + " deletado";
                }
            }));
        }

        private void btnExcluir_Click(object sender, EventArgs e)
        {
            string idExcluir = txtExcluir.Text;
            SerialPortManager.Port.Write("!delete" + idExcluir + "#");
        }
    }
}
