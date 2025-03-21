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
    public partial class frmVerificacao : Form
    {
        public frmVerificacao()
        {
            InitializeComponent();
        }

        private void frmVerificacao_Load(object sender, EventArgs e)
        {

        }

        private void btnCadastro_Click(object sender, EventArgs e)
        {

        }

        private void btncadastro_MouseEnter(object sender, EventArgs e)
        {
            btnCadastro.BackColor = Color.Red; // Define a cor de fundo como cinza
        }

        private void btnCadastro_MouseLeave(object sender, EventArgs e)
        {
            btnCadastro.BackColor = SystemColors.Control; // Retorna à cor padrão do sistema
        }

    }
}
