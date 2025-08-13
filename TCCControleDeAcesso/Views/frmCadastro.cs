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
    public partial class frmCadastro : Form
    {
        int id;
        public frmCadastro()
        {
            InitializeComponent();
            SerialPortManager.Port.DataReceived += serialPort_DataReceived;
        }

        private void btnCadastrar_Click(object sender, EventArgs e)
        {
            SerialPortManager.Port.Write("!enroll" + id + "#");
        }

        private void serialPort_DataReceived(object sender, EventArgs e)
        {
            string received = SerialPortManager.Port.ReadLine();

            acao.Invoke(new Action(() => {
                if (received.StartsWith("!enrolling"))
                {
                    received = received.Replace("!enrolling", "");
                    received = received.Replace("#", "");
                    acao.Text = "Cadastrando o ID " + received;
                }
                else if (received.StartsWith("!placeFinger#"))
                {
                    acao.Text = "Coloque o dedo no sensor";
                }
                else if (received.StartsWith("!imageTaken#"))
                {
                    acao.Text = "Dedo capturado";
                }
                else if (received.StartsWith("!removeFinger#"))
                {
                    acao.Text = "Tire o dedo do sensor";
                }
                else if (received.StartsWith("!enrolled"))
                {
                    received = received.Replace("!enrolled", "");
                    received = received.Replace("#", "");
                    acao.Text = "ID" + received + " cadastrado";
                }
            }));
        }
    }
}
