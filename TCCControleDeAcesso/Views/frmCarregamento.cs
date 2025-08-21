using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace TCCControleDeAcesso.Views
{
    public partial class frmCarregamento : Form
    {
        public frmCarregamento()
        {
            InitializeComponent();
        }

        private void label2_Click(object sender, EventArgs e)
        {

        }

        private void frmCarregamento_Load(object sender, EventArgs e)
        {
            timer1.Start(); 
        }

        private void timer1_Tick(object sender, EventArgs e)
        {
            if(progressBar1.Value < 100)
            {
                progressBar1.Value += 1;

                label2.Text = progressBar1.Value.ToString() + "&";
            }

            else 
            {
                timer1.Stop();

                MessageBox.Show("Carregado com sucesso!");
            }
        }

        private void progressBar1_Click(object sender, EventArgs e)
        {

        }
    }
}
