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
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmVerificacao : Form
    {
        bool verificando;

        public frmVerificacao()
        {
            InitializeComponent();
            SerialPortManager.Port.DataReceived += serialPort_DataReceived;
        }

        private void btnVerificar_Click(object sender, EventArgs e)
        {
            if (!verificando)
            {
                SerialPortManager.Port.Write("!verify#");
                btnVerificar.Text = "Parar";
                progressBarVerificar.Value = 100;
                verificando = true;
            }
            else if (verificando)
            {
                SerialPortManager.Port.Write("!a#");
                btnVerificar.Text = "Verificar";
                progressBarVerificar.Value = 0;
                verificando = false;
            }
        }

        private void serialPort_DataReceived(object sender, EventArgs e)
        {
            string received = SerialPortManager.Port.ReadLine();
            aluno.Invoke(new Action(() => {
                if (received.StartsWith("!found"))
                {
                    received = received.Replace("!found", "");
                    received = received.Replace("#", "");
                    aluno.Text = received;
                }
            }));
        }
    }
}
